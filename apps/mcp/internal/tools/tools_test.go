package tools

import (
	"context"
	"errors"
	"strings"
	"testing"

	"mcp/internal/gRPC"
	"packages/pb"

	"github.com/modelcontextprotocol/go-sdk/mcp"
	"google.golang.org/grpc"
)

// fakeReplClient is an in-process pb.ReplServiceClient.
type fakeReplClient struct {
	resp    *pb.FetchContentResponse
	err     error
	gotPath string
}

func (f *fakeReplClient) FetchContent(ctx context.Context, in *pb.FetchContentRequest, opts ...grpc.CallOption) (*pb.FetchContentResponse, error) {
	f.gotPath = in.Path
	return f.resp, f.err
}

func resultText(t *testing.T, res *mcp.CallToolResultFor[any]) string {
	t.Helper()
	if len(res.Content) != 1 {
		t.Fatalf("result has %d content items, want 1", len(res.Content))
	}
	text, ok := res.Content[0].(*mcp.TextContent)
	if !ok {
		t.Fatalf("result content is %T, want *mcp.TextContent", res.Content[0])
	}
	return text.Text
}

func TestReadFile(t *testing.T) {
	tests := []struct {
		name        string
		client      *fakeReplClient
		wantIsError bool
		wantText    string // exact for success, substring for errors
	}{
		{
			name:     "success",
			client:   &fakeReplClient{resp: &pb.FetchContentResponse{Content: "package main\n"}},
			wantText: "package main\n",
		},
		{
			name:        "grpc error",
			client:      &fakeReplClient{err: errors.New("connection refused")},
			wantIsError: true,
			wantText:    "Failed to read file: connection refused",
		},
		{
			name:        "error in response",
			client:      &fakeReplClient{resp: &pb.FetchContentResponse{Error: "no such file"}},
			wantIsError: true,
			wantText:    "Error reading file: no such file",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewToolsHandler(&gRPC.ReplClient{Client: tt.client})
			params := &mcp.CallToolParamsFor[ReadFileParams]{
				Arguments: ReadFileParams{Path: "src/main.go"},
			}

			res, err := h.ReadFile(context.Background(), nil, params)
			if err != nil {
				t.Fatalf("ReadFile returned error %v, want errors reported in the result", err)
			}
			if tt.client.gotPath != "src/main.go" {
				t.Errorf("FetchContent path = %q, want %q", tt.client.gotPath, "src/main.go")
			}
			if res.IsError != tt.wantIsError {
				t.Errorf("IsError = %v, want %v", res.IsError, tt.wantIsError)
			}
			text := resultText(t, res)
			if tt.wantIsError {
				if !strings.Contains(text, tt.wantText) {
					t.Errorf("text = %q, want it to contain %q", text, tt.wantText)
				}
			} else if text != tt.wantText {
				t.Errorf("text = %q, want %q", text, tt.wantText)
			}
		})
	}
}

func TestPing(t *testing.T) {
	h := NewToolsHandler(nil)

	res, err := h.Ping(context.Background(), nil, &mcp.CallToolParamsFor[mcp.PingParams]{})
	if err != nil {
		t.Fatalf("Ping: %v", err)
	}
	if res.IsError {
		t.Error("Ping result IsError = true")
	}
	if text := resultText(t, res); text != "hello world" {
		t.Errorf("Ping text = %q, want %q", text, "hello world")
	}
}
