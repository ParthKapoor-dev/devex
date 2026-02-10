package k8s

import (
	"context"
	log "packages/logging"
	"path/filepath"

	"core/pkg/dotenv"

	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/homedir"
)

var KUBE_CONFIG_PATH = dotenv.EnvString("KUBE_CONFIG_PATH", filepath.Join(homedir.HomeDir(), ".kube", "config"))

// Initializes the K8s dynamic client
func getDynamicClient() (dynamic.Interface, error) {
	kubeconfig := KUBE_CONFIG_PATH
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Error("Load kubeconfig failed", "kubeconfig_path", kubeconfig, "error", err)
		return nil, err
	}

	dynamicClient, err := dynamic.NewForConfig(config)
	if err != nil {
		log.Error("Create dynamic client failed", "error", err)
		return nil, err
	}

	return dynamicClient, nil
}

// Initializes the K8s client
func getClientSet() (*kubernetes.Clientset, error) {
	kubeconfig := KUBE_CONFIG_PATH
	config, err := clientcmd.BuildConfigFromFlags("", kubeconfig)
	if err != nil {
		log.Error("Load kubeconfig failed", "kubeconfig_path", kubeconfig, "error", err)
		return nil, err
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		log.Error("Create clientset failed", "error", err)
		return nil, err
	}

	return clientset, nil
}

func CheckStatus() (bool, error) {
	clientset, err := getClientSet()
	if err != nil {
		return false, err
	}

	_, err = clientset.CoreV1().Nodes().List(context.TODO(), metav1.ListOptions{})
	if err != nil {
		log.Error("List Kubernetes nodes failed", "error", err)
		return false, err
	}

	return true, nil
}

// Utility functions
func int32Ptr(i int32) *int32 {
	return &i
}

func intstrFromInt(i int) intstr.IntOrString {
	return intstr.IntOrString{Type: intstr.Int, IntVal: int32(i)}
}

func pathTypePtr(pt networkingv1.PathType) *networkingv1.PathType {
	return &pt
}

func strPtr(s string) *string {
	return &s
}

func awsEnvVars() []corev1.EnvVar {
	return []corev1.EnvVar{
		{
			Name: "AWS_ACCESS_KEY_ID",
			ValueFrom: &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{
						Name: "aws-creds",
					},
					Key: "access_key",
				},
			},
		},
		{
			Name: "AWS_SECRET_ACCESS_KEY",
			ValueFrom: &corev1.EnvVarSource{
				SecretKeyRef: &corev1.SecretKeySelector{
					LocalObjectReference: corev1.LocalObjectReference{
						Name: "aws-creds",
					},
					Key: "secret_key",
				},
			},
		},
	}
}
