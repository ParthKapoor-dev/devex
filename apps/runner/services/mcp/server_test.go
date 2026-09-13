package mcp

import (
	"context"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"

	"packages/pb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"
)

// startServer serves the gRPC service in-process over bufconn with its
// workspace root in a temp dir, and returns a client and that root.
func startServer(t *testing.T) (pb.ReplServiceClient, string) {
	t.Helper()

	root := t.TempDir()
	previous := workspaceRoot
	workspaceRoot = root
	t.Cleanup(func() { workspaceRoot = previous })

	lis := bufconn.Listen(1 << 20)
	server := grpc.NewServer()
	pb.RegisterReplServiceServer(server, &grpcServer{})
	go server.Serve(lis)
	t.Cleanup(server.Stop)

	conn, err := grpc.NewClient("passthrough:///bufconn",
		grpc.WithContextDialer(func(ctx context.Context, _ string) (net.Conn, error) {
			return lis.DialContext(ctx)
		}),
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		t.Fatalf("grpc.NewClient: %v", err)
	}
	t.Cleanup(func() { conn.Close() })

	return pb.NewReplServiceClient(conn), root
}

func TestFetchContent(t *testing.T) {
	client, root := startServer(t)
	if err := os.MkdirAll(filepath.Join(root, "src"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(root, "src", "main.go"), []byte("package main\n"), 0644); err != nil {
		t.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	resp, err := client.FetchContent(ctx, &pb.FetchContentRequest{Path: "src/main.go"})
	if err != nil {
		t.Fatalf("FetchContent: %v", err)
	}
	if resp.Content != "package main\n" || resp.Error != "" {
		t.Errorf("FetchContent = {Content: %q, Error: %q}, want {Content: %q}", resp.Content, resp.Error, "package main\n")
	}

	if _, err := client.FetchContent(ctx, &pb.FetchContentRequest{Path: "missing.go"}); err == nil {
		t.Error("FetchContent of a missing file returned no error")
	}
}
