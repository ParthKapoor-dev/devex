package k8s

import (
	"context"
	"fmt"
	"log"

	"core/models"
	"core/pkg/dotenv"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
)

var RUNNER_CLUSTER_IP = dotenv.EnvString("RUNNER_CLUSTER_IP", "localhost")
var ENABLE_MCP_SIDECAR = dotenv.EnvString("ENABLE_MCP_SIDECAR", "false") == "true"

func CreateReplDeploymentAndService(userName, replId, template string) error {
	clientset, _ := getClientSet()
	ctx := context.Background()

	config, exists := models.TemplateConfigs[template]
	if !exists {
		return fmt.Errorf("unsupported template: %s", template)
	}

	bucket := dotenv.EnvString("S3_BUCKET", "devex")
	endpoint := dotenv.EnvString("S3_ENDPOINT", "https://<account_id>.r2.cloudflarestorage.com")
	region := dotenv.EnvString("S3_REGION", "us-east-1")

	labels := map[string]string{
		"app":      replId,
		"template": template,
	}

	// 1. Deployment
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId,
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: int32Ptr(1),
			Selector: &metav1.LabelSelector{
				MatchLabels: labels,
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: labels,
				},
				Spec: corev1.PodSpec{
					Volumes: []corev1.Volume{
						{
							Name: "workspace-vol",
							VolumeSource: corev1.VolumeSource{
								EmptyDir: &corev1.EmptyDirVolumeSource{},
							},
						},
					},
					InitContainers: []corev1.Container{
						{
							Name:    "s3-downloader",
							Image:   "amazon/aws-cli",
							Command: []string{"sh", "-c"},
							Args: []string{
								fmt.Sprintf(`aws s3 cp s3://%s/repl/%s/%s/ /workspaces --recursive --endpoint-url %s --region %s && echo "Resources copied from S3/R2";`, bucket, userName, replId, endpoint, region),
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "workspace-vol",
									MountPath: "/workspaces",
								},
							},
							Env: awsEnvVars(),
						},
					},
					Containers: func() []corev1.Container {
						containers := []corev1.Container{
							{
								Name:            "runner",
								Image:           fmt.Sprintf("ghcr.io/parthkapoor-dev/devex/runner-%s:latest", template),
								ImagePullPolicy: corev1.PullAlways,
								Env: []corev1.EnvVar{
									{
										Name:  "REPL_ID",
										Value: replId,
									},
									{
										Name:  "TEMPLATE",
										Value: template,
									},
								},
								VolumeMounts: []corev1.VolumeMount{
									{
										Name:      "workspace-vol",
										MountPath: "/workspaces",
									},
								},
								Ports: []corev1.ContainerPort{
									{
										Name:          "http",
										ContainerPort: config.Port,
									},
									{
										Name:          "grpc",
										ContainerPort: 50051,
										Protocol:      corev1.ProtocolTCP,
									},
								},
							},
						}

						if ENABLE_MCP_SIDECAR {
							containers = append(containers, corev1.Container{
								Name:            "mcp-server",
								Image:           "ghcr.io/parthkapoor-dev/devex/mcp:latest",
								ImagePullPolicy: corev1.PullAlways,
								Env: []corev1.EnvVar{
									{
										Name:  "REPL_ID",
										Value: replId,
									},
									{
										Name:  "TEMPLATE",
										Value: template,
									},
								},
								VolumeMounts: []corev1.VolumeMount{
									{
										Name:      "workspace-vol",
										MountPath: "/workspaces",
									},
								},
								Ports: []corev1.ContainerPort{
									{
										Name:          "mcp-http",
										ContainerPort: 8080,
										Protocol:      corev1.ProtocolTCP,
									},
								},
							})
						}
						return containers
					}(),
				},
			},
		},
	}

	_, err := clientset.AppsV1().Deployments("default").Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create deployment: %w", err)
	}

	// 2. Service
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId,
		},
		Spec: corev1.ServiceSpec{
			Selector: labels,
			Ports: func() []corev1.ServicePort {
				ports := []corev1.ServicePort{
					{
						Name:       "http",
						Port:       config.Port,
						TargetPort: intstr.FromInt(int(config.Port)),
					},
					{
						Name:       "grpc",
						Port:       50051,
						TargetPort: intstr.FromInt(50051),
						Protocol:   corev1.ProtocolTCP,
					},
				}
				if ENABLE_MCP_SIDECAR {
					ports = append(ports, corev1.ServicePort{
						Name:       "mcp-http",
						Port:       8080,
						TargetPort: intstr.FromInt(8080),
						Protocol:   corev1.ProtocolTCP,
					})
				}
				return ports
			}(),
			Type: corev1.ServiceTypeClusterIP,
		},
	}

	_, err = clientset.CoreV1().Services("default").Create(ctx, service, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create service: %w", err)
	}

	// 3. Ingress
	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name: replId + "-ingress",
			Annotations: map[string]string{
				"cert-manager.io/cluster-issuer":                 "letsencrypt-cluster-issuer",
				"nginx.ingress.kubernetes.io/use-regex":          "true",
				"nginx.ingress.kubernetes.io/rewrite-target":     "/$2", // Captures group after the replId
				"nginx.ingress.kubernetes.io/websocket-services": replId,
				"nginx.ingress.kubernetes.io/ssl-redirect":       "false",
				"nginx.ingress.kubernetes.io/proxy-read-timeout": "3600",
				"nginx.ingress.kubernetes.io/proxy-send-timeout": "3600",
			},
		},
		Spec: networkingv1.IngressSpec{
			IngressClassName: strPtr("nginx"),
			TLS: []networkingv1.IngressTLS{
				{
					Hosts:      []string{RUNNER_CLUSTER_IP},
					SecretName: "tls-secret",
				},
			},
			Rules: []networkingv1.IngressRule{
				{
					Host: RUNNER_CLUSTER_IP,
					IngressRuleValue: networkingv1.IngressRuleValue{
						HTTP: &networkingv1.HTTPIngressRuleValue{
							Paths: func() []networkingv1.HTTPIngressPath {
								paths := []networkingv1.HTTPIngressPath{
									{
										Path:     fmt.Sprintf("/(%s)/(.*)", replId),
										PathType: pathTypePtr(networkingv1.PathTypeImplementationSpecific),
										Backend: networkingv1.IngressBackend{
											Service: &networkingv1.IngressServiceBackend{
												Name: replId,
												Port: networkingv1.ServiceBackendPort{
													Number: config.Port,
												},
											},
										},
									},
								}

								if ENABLE_MCP_SIDECAR {
									paths = append(paths, networkingv1.HTTPIngressPath{
										Path:     fmt.Sprintf("/mcp/(%s)/(.*)", replId),
										PathType: pathTypePtr(networkingv1.PathTypeImplementationSpecific),
										Backend: networkingv1.IngressBackend{
											Service: &networkingv1.IngressServiceBackend{
												Name: replId,
												Port: networkingv1.ServiceBackendPort{
													Number: 8080,
												},
											},
										},
									})
								}
								return paths
							}(),
						},
					},
				},
			},
		},
	}

	_, err = clientset.NetworkingV1().Ingresses("default").Create(ctx, ingress, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create ingress: %w", err)
	}

	if ENABLE_MCP_SIDECAR {
		log.Printf("✅ Deployment and Service for repl %s (template: %s) created with MCP sidecar.\n", replId, template)
	} else {
		log.Printf("✅ Deployment and Service for repl %s (template: %s) created.\n", replId, template)
	}
	return nil
}
