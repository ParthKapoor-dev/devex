package k8s

import (
	"context"
	"maps"
	"os"
	"slices"
	"strings"
	"testing"

	"core/models"

	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/dynamic"
	dynamicfake "k8s.io/client-go/dynamic/fake"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/fake"
)

var middlewareGVR = schema.GroupVersionResource{Group: "traefik.io", Version: "v1alpha1", Resource: "middlewares"}

// A test that forgets to install fakes must never reach the cluster in the
// local kubeconfig.
func TestMain(m *testing.M) {
	newClientSet = func() (kubernetes.Interface, error) {
		panic("test did not install a fake clientset")
	}
	newDynamicClient = func() (dynamic.Interface, error) {
		panic("test did not install a fake dynamic client")
	}
	os.Exit(m.Run())
}

type fakeClients struct {
	clientset *fake.Clientset
	dynamic   *dynamicfake.FakeDynamicClient
}

func useFakeClients(t *testing.T, objects ...runtime.Object) fakeClients {
	t.Helper()
	f := fakeClients{
		clientset: fake.NewClientset(objects...),
		dynamic: dynamicfake.NewSimpleDynamicClientWithCustomListKinds(runtime.NewScheme(),
			map[schema.GroupVersionResource]string{middlewareGVR: "MiddlewareList"}),
	}

	prevClientSet, prevDynamic := newClientSet, newDynamicClient
	newClientSet = func() (kubernetes.Interface, error) { return f.clientset, nil }
	newDynamicClient = func() (dynamic.Interface, error) { return f.dynamic, nil }
	t.Cleanup(func() {
		newClientSet, newDynamicClient = prevClientSet, prevDynamic
	})
	return f
}

func setSidecar(t *testing.T, enabled bool) {
	t.Helper()
	prev := ENABLE_MCP_SIDECAR
	ENABLE_MCP_SIDECAR = enabled
	t.Cleanup(func() { ENABLE_MCP_SIDECAR = prev })
}

func setClusterHost(t *testing.T, host string) {
	t.Helper()
	prev := RUNNER_CLUSTER_IP
	RUNNER_CLUSTER_IP = host
	t.Cleanup(func() { RUNNER_CLUSTER_IP = prev })
}

func setS3Env(t *testing.T) {
	t.Helper()
	t.Setenv("S3_BUCKET", "test-bucket")
	t.Setenv("S3_ENDPOINT", "https://r2.test")
	t.Setenv("S3_REGION", "auto")
}

func TestCreateReplDeploymentAndService(t *testing.T) {
	cases := []struct {
		name    string
		sidecar bool
	}{
		{name: "without mcp sidecar", sidecar: false},
		{name: "with mcp sidecar", sidecar: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			f := useFakeClients(t)
			setSidecar(t, tc.sidecar)
			setClusterHost(t, "runner.test")
			setS3Env(t)
			ctx := context.Background()

			const replId = "repl-123"
			if err := CreateReplDeploymentAndService("alice", replId, "node"); err != nil {
				t.Fatalf("CreateReplDeploymentAndService: %v", err)
			}
			port := models.TemplateConfigs["node"].Port
			wantLabels := map[string]string{"app": replId, "template": "node"}

			// Deployment
			dep, err := f.clientset.AppsV1().Deployments("default").Get(ctx, replId, metav1.GetOptions{})
			if err != nil {
				t.Fatalf("get deployment: %v", err)
			}
			if got := *dep.Spec.Replicas; got != 1 {
				t.Errorf("replicas = %d, want 1", got)
			}
			if !maps.Equal(dep.Spec.Selector.MatchLabels, wantLabels) {
				t.Errorf("selector = %v, want %v", dep.Spec.Selector.MatchLabels, wantLabels)
			}
			if !maps.Equal(dep.Spec.Template.Labels, wantLabels) {
				t.Errorf("pod labels = %v, want %v", dep.Spec.Template.Labels, wantLabels)
			}

			pod := dep.Spec.Template.Spec
			if len(pod.InitContainers) != 1 {
				t.Fatalf("init containers = %d, want 1", len(pod.InitContainers))
			}
			initArgs := strings.Join(pod.InitContainers[0].Args, " ")
			for _, want := range []string{"s3://test-bucket/repl/alice/repl-123/", "/workspaces", "--endpoint-url https://r2.test", "--region auto"} {
				if !strings.Contains(initArgs, want) {
					t.Errorf("init container args %q missing %q", initArgs, want)
				}
			}

			runner := findContainer(pod.Containers, "runner")
			if runner == nil {
				t.Fatal("runner container missing")
			}
			if want := "ghcr.io/parthkapoor-dev/devex/runner-node:latest"; runner.Image != want {
				t.Errorf("runner image = %q, want %q", runner.Image, want)
			}
			if !hasContainerPort(runner.Ports, "http", port) || !hasContainerPort(runner.Ports, "grpc", 50051) {
				t.Errorf("runner ports = %+v, want http:%d and grpc:50051", runner.Ports, port)
			}
			if !hasEnv(runner.Env, "REPL_ID", replId) || !hasEnv(runner.Env, "TEMPLATE", "node") {
				t.Errorf("runner env = %+v, want REPL_ID and TEMPLATE", runner.Env)
			}

			mcp := findContainer(pod.Containers, "mcp-server")
			if tc.sidecar {
				if mcp == nil {
					t.Fatal("mcp-server container missing with sidecar enabled")
				}
				if !hasContainerPort(mcp.Ports, "mcp-http", 8080) {
					t.Errorf("mcp ports = %+v, want mcp-http:8080", mcp.Ports)
				}
			} else if mcp != nil {
				t.Error("mcp-server container present with sidecar disabled")
			}

			// Service
			svc, err := f.clientset.CoreV1().Services("default").Get(ctx, replId, metav1.GetOptions{})
			if err != nil {
				t.Fatalf("get service: %v", err)
			}
			if !maps.Equal(svc.Spec.Selector, dep.Spec.Template.Labels) {
				t.Errorf("service selector %v does not match pod labels %v", svc.Spec.Selector, dep.Spec.Template.Labels)
			}
			if svc.Spec.Type != corev1.ServiceTypeClusterIP {
				t.Errorf("service type = %s, want ClusterIP", svc.Spec.Type)
			}
			wantPorts := map[string]int32{"http": port, "grpc": 50051}
			if tc.sidecar {
				wantPorts["mcp-http"] = 8080
			}
			if len(svc.Spec.Ports) != len(wantPorts) {
				t.Errorf("service ports = %+v, want %v", svc.Spec.Ports, wantPorts)
			}
			for _, p := range svc.Spec.Ports {
				if want, ok := wantPorts[p.Name]; !ok || p.Port != want || p.TargetPort != intstr.FromInt(int(want)) {
					t.Errorf("service port %+v not in %v", p, wantPorts)
				}
			}

			// Middleware
			mw, err := f.dynamic.Resource(middlewareGVR).Namespace("default").Get(ctx, replId+"-stripprefix", metav1.GetOptions{})
			if err != nil {
				t.Fatalf("get middleware: %v", err)
			}
			if mw.GetKind() != "Middleware" || mw.GetAPIVersion() != "traefik.io/v1alpha1" {
				t.Errorf("middleware kind = %s %s", mw.GetAPIVersion(), mw.GetKind())
			}
			prefixes, _, err := unstructured.NestedStringSlice(mw.Object, "spec", "stripPrefix", "prefixes")
			if err != nil {
				t.Fatalf("read prefixes: %v", err)
			}
			wantPrefixes := []string{"/repl-123", "/repl-123/"}
			if tc.sidecar {
				wantPrefixes = append(wantPrefixes, "/mcp/repl-123", "/mcp/repl-123/")
			}
			if !slices.Equal(prefixes, wantPrefixes) {
				t.Errorf("prefixes = %v, want %v", prefixes, wantPrefixes)
			}

			// Ingress
			ing, err := f.clientset.NetworkingV1().Ingresses("default").Get(ctx, replId+"-ingress", metav1.GetOptions{})
			if err != nil {
				t.Fatalf("get ingress: %v", err)
			}
			if got, want := ing.Annotations["traefik.ingress.kubernetes.io/router.middlewares"], "default-repl-123-stripprefix@kubernetescrd"; got != want {
				t.Errorf("middlewares annotation = %q, want %q", got, want)
			}
			if len(ing.Spec.TLS) != 1 || !slices.Equal(ing.Spec.TLS[0].Hosts, []string{"runner.test"}) {
				t.Errorf("TLS = %+v, want host runner.test", ing.Spec.TLS)
			}
			if len(ing.Spec.Rules) != 1 || ing.Spec.Rules[0].Host != "runner.test" {
				t.Fatalf("rules = %+v, want one rule for runner.test", ing.Spec.Rules)
			}
			paths := ing.Spec.Rules[0].HTTP.Paths
			wantPaths := map[string]int32{"/repl-123": port}
			if tc.sidecar {
				wantPaths["/mcp/repl-123"] = 8080
			}
			if len(paths) != len(wantPaths) {
				t.Errorf("ingress paths = %+v, want %v", paths, wantPaths)
			}
			for _, p := range paths {
				want, ok := wantPaths[p.Path]
				if !ok || p.Backend.Service.Name != replId || p.Backend.Service.Port.Number != want {
					t.Errorf("ingress path %s -> %s:%d not in %v", p.Path, p.Backend.Service.Name, p.Backend.Service.Port.Number, wantPaths)
				}
			}
		})
	}
}

func TestBuildDeploymentUsesTemplateImage(t *testing.T) {
	for template, config := range models.TemplateConfigs {
		dep := buildDeployment("alice", "repl-1", template, map[string]string{"app": "repl-1"}, config.Port, "b", "e", "r")
		runner := findContainer(dep.Spec.Template.Spec.Containers, "runner")
		if runner == nil {
			t.Fatalf("%s: runner container missing", template)
		}
		if want := "ghcr.io/parthkapoor-dev/devex/runner-" + template + ":latest"; runner.Image != want {
			t.Errorf("%s: image = %q, want %q", template, runner.Image, want)
		}
	}
}

func TestCreateReplDeploymentAndServiceUnsupportedTemplate(t *testing.T) {
	f := useFakeClients(t)

	err := CreateReplDeploymentAndService("alice", "repl-1", "cobol")
	if err == nil || !strings.Contains(err.Error(), "unsupported template") {
		t.Fatalf("err = %v, want unsupported template", err)
	}

	deps, err := f.clientset.AppsV1().Deployments("default").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		t.Fatal(err)
	}
	if len(deps.Items) != 0 {
		t.Errorf("created %d deployments for an unsupported template", len(deps.Items))
	}
}

func TestDeleteReplDeploymentAndService(t *testing.T) {
	cases := []struct {
		name string
		pod  *corev1.Pod
	}{
		{name: "uploader succeeds", pod: replPod("repl-123", 0)},
		{name: "uploader fails", pod: replPod("repl-123", 1)},
		{name: "no running pod", pod: nil},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var objects []runtime.Object
			if tc.pod != nil {
				objects = append(objects, tc.pod)
			}
			f := useFakeClients(t, objects...)
			setSidecar(t, false)
			setS3Env(t)
			ctx := context.Background()

			if err := CreateReplDeploymentAndService("alice", "repl-123", "node"); err != nil {
				t.Fatalf("create: %v", err)
			}
			if err := DeleteReplDeploymentAndService("alice", "repl-123"); err != nil {
				t.Fatalf("delete: %v", err)
			}

			if _, err := f.clientset.AppsV1().Deployments("default").Get(ctx, "repl-123", metav1.GetOptions{}); !apierrors.IsNotFound(err) {
				t.Errorf("deployment still present: %v", err)
			}
			if _, err := f.clientset.CoreV1().Services("default").Get(ctx, "repl-123", metav1.GetOptions{}); !apierrors.IsNotFound(err) {
				t.Errorf("service still present: %v", err)
			}
			if _, err := f.clientset.NetworkingV1().Ingresses("default").Get(ctx, "repl-123-ingress", metav1.GetOptions{}); !apierrors.IsNotFound(err) {
				t.Errorf("ingress still present: %v", err)
			}
			if _, err := f.dynamic.Resource(middlewareGVR).Namespace("default").Get(ctx, "repl-123-stripprefix", metav1.GetOptions{}); !apierrors.IsNotFound(err) {
				t.Errorf("middleware still present: %v", err)
			}
		})
	}
}

func TestInjectEphemeralUploader(t *testing.T) {
	cases := []struct {
		name     string
		exitCode int32
		wantErr  bool
	}{
		{name: "upload succeeds", exitCode: 0, wantErr: false},
		{name: "upload fails", exitCode: 1, wantErr: true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			clientset := fake.NewClientset(replPod("repl-123", tc.exitCode))
			ctx := context.Background()

			err := InjectEphemeralUploader(clientset, ctx, "repl-123", "alice", "https://r2.test", "test-bucket", "auto")
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tc.wantErr)
			}

			pod, err := clientset.CoreV1().Pods("default").Get(ctx, "repl-123-pod", metav1.GetOptions{})
			if err != nil {
				t.Fatal(err)
			}
			if len(pod.Spec.EphemeralContainers) != 1 {
				t.Fatalf("ephemeral containers = %d, want 1", len(pod.Spec.EphemeralContainers))
			}
			ec := pod.Spec.EphemeralContainers[0]
			if ec.Name != "s3-uploader" {
				t.Errorf("ephemeral container name = %q", ec.Name)
			}
			args := strings.Join(ec.Args, " ")
			for _, want := range []string{"aws s3 cp /workspaces s3://test-bucket/repl/alice/repl-123/", "--endpoint-url https://r2.test", "--region auto"} {
				if !strings.Contains(args, want) {
					t.Errorf("uploader args %q missing %q", args, want)
				}
			}
		})
	}
}

// replPod is a running repl pod whose uploader has already terminated, so
// waitForEphemeralUpload returns on its first poll.
func replPod(replId string, uploaderExitCode int32) *corev1.Pod {
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:      replId + "-pod",
			Namespace: "default",
			Labels:    map[string]string{"app": replId, "template": "node"},
		},
		Status: corev1.PodStatus{
			EphemeralContainerStatuses: []corev1.ContainerStatus{
				{
					Name: "s3-uploader",
					State: corev1.ContainerState{
						Terminated: &corev1.ContainerStateTerminated{ExitCode: uploaderExitCode},
					},
				},
			},
		},
	}
}

func findContainer(containers []corev1.Container, name string) *corev1.Container {
	for i := range containers {
		if containers[i].Name == name {
			return &containers[i]
		}
	}
	return nil
}

func hasContainerPort(ports []corev1.ContainerPort, name string, port int32) bool {
	for _, p := range ports {
		if p.Name == name && p.ContainerPort == port {
			return true
		}
	}
	return false
}

func hasEnv(env []corev1.EnvVar, name, value string) bool {
	for _, e := range env {
		if e.Name == name && e.Value == value {
			return true
		}
	}
	return false
}
