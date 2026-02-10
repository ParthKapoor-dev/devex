package k8s

import (
	"context"
	"fmt"
	log "packages/logging"
	"time"

	"core/pkg/dotenv"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/kubernetes"
)

func DeleteReplDeploymentAndService(userName, replId string) error {
	clientset, _ := getClientSet()
	dynamicClient, _ := getDynamicClient()
	ctx := context.Background()

	bucket := dotenv.EnvString("S3_BUCKET", "devex")
	endpoint := dotenv.EnvString("S3_ENDPOINT", "https://<account_id>.r2.cloudflarestorage.com")
	region := dotenv.EnvString("S3_REGION", "us-east-1")

	// Step 1: Upload workspace from pod to S3/R2
	log.Info("Uploading workspace from pod to S3/R2", "repl_id", replId, "user", userName, "bucket", bucket)

	if err := InjectEphemeralUploader(clientset, ctx, replId, userName, endpoint, bucket, region); err != nil {
		log.Warn("Inject uploader failed", "repl_id", replId, "error", err)
	} else {
		log.Info("Uploaded /workspaces to S3/R2", "repl_id", replId, "user", userName, "bucket", bucket)
	}

	// Step 2: Delete resources
	middlewareRes := schema.GroupVersionResource{Group: "traefik.io", Version: "v1alpha1", Resource: "middlewares"}
	for _, resource := range []struct {
		name string
		del  func() error
	}{
		{
			name: "Middleware",
			del: func() error {
				return dynamicClient.Resource(middlewareRes).Namespace("default").Delete(ctx, replId+"-stripprefix", metav1.DeleteOptions{})
			},
		},
		{
			name: "Ingress",
			del: func() error {
				return clientset.NetworkingV1().Ingresses("default").Delete(ctx, replId+"-ingress", metav1.DeleteOptions{})
			},
		},
		{
			name: "Service",
			del: func() error {
				return clientset.CoreV1().Services("default").Delete(ctx, replId, metav1.DeleteOptions{})
			},
		},
		{
			name: "Deployment",
			del: func() error {
				return clientset.AppsV1().Deployments("default").Delete(ctx, replId, metav1.DeleteOptions{})
			},
		},
	} {
		err := resource.del()
		if err != nil {
			log.Warn("Delete resource failed", "repl_id", replId, "resource", resource.name, "error", err)
		} else {
			log.Info("Resource deleted", "repl_id", replId, "resource", resource.name)
		}
	}

	return nil
}

// InjectEphemeralUploader injects an ephemeral container into the running REPL pod to upload files
func InjectEphemeralUploader(clientset *kubernetes.Clientset, ctx context.Context, replId, userName, endpoint, bucket, region string) error {
	const namespace = "default"

	// Fetch the target pod
	podList, err := clientset.CoreV1().Pods("default").List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", replId),
	})
	if err != nil || len(podList.Items) == 0 {
		return err
	}
	pod := podList.Items[0]

	// Prepare the ephemeral container spec
	ephemeral := corev1.EphemeralContainer{
		EphemeralContainerCommon: corev1.EphemeralContainerCommon{
			Name:    "s3-uploader",
			Image:   "amazon/aws-cli",
			Command: []string{"sh", "-c"},
			Args: []string{
				fmt.Sprintf(`aws s3 cp /workspaces s3://%s/repl/%s/%s/ --recursive --endpoint-url %s --region %s`, bucket, userName, replId, endpoint, region),
			},
			VolumeMounts: []corev1.VolumeMount{
				{
					Name:      "workspace-vol",
					MountPath: "/workspaces",
				},
			},
			Env: awsEnvVars(),
		},
		// TargetContainerName: "runner", // optional but helps in debugging
	}

	pod.Spec.EphemeralContainers = append(pod.Spec.EphemeralContainers, ephemeral)

	if _, err = clientset.CoreV1().Pods(namespace).UpdateEphemeralContainers(
		ctx, pod.Name, &pod, metav1.UpdateOptions{}); err != nil {
		return fmt.Errorf("failed to update pod with ephemeral container: %w", err)
	}
	log.Info("Ephemeral uploader injected into pod", "repl_id", replId, "pod", pod.Name)

	if err := waitForEphemeralUpload(clientset, pod.Name); err != nil {
		return err
	}

	return nil
}

func waitForEphemeralUpload(clientset *kubernetes.Clientset, podName string) error {
	const (
		namespace = "default"
		timeout   = 2 * time.Minute
		interval  = 2 * time.Second
	)

	start := time.Now()
	for time.Since(start) < timeout {
		pod, err := clientset.CoreV1().Pods(namespace).Get(context.Background(), podName, metav1.GetOptions{})
		if err != nil {
			return fmt.Errorf("failed to get updated pod: %w", err)
		}

		for _, ec := range pod.Status.EphemeralContainerStatuses {
			if ec.Name == "s3-uploader" {
				if ec.State.Terminated != nil {
					if ec.State.Terminated.ExitCode == 0 {
						log.Info("Ephemeral container finished successfully", "pod", pod.Name)
						return nil
					}
					return fmt.Errorf("ephemeral container failed with code %d", ec.State.Terminated.ExitCode)
				}
			}
		}

		log.Debug("Waiting for ephemeral uploader to complete", "pod", podName)
		time.Sleep(interval)
	}

	return fmt.Errorf("timeout: ephemeral container did not finish in time")
}
