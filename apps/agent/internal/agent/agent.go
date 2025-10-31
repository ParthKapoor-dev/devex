package agent

import (
	"context"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	pb "packages/pb"
)

// Agent represents the core AI agent orchestrator.
type Agent struct {
	mcpClient pb.ReplServiceClient
}

// NewAgent creates a new Agent instance.
func NewAgent(mcpServerAddr string) (*Agent, error) {
	conn, err := grpc.NewClient(
		mcpServerAddr,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
	)
	if err != nil {
		return nil, err
	}

	mcpClient := pb.NewReplServiceClient(conn)

	return &Agent{
		mcpClient: mcpClient,
	}, nil
}

// ExecuteCommand sends a command to the MCP server and returns its output.
func (a *Agent) ExecuteCommand(ctx context.Context, command string, workingDir string) (string, string, error) {
	log.Printf("Agent: Executing command '%s' in '%s'", command, workingDir)

	req := &pb.ExecuteCommandRequest{
		Command:    command,
		WorkingDir: workingDir,
		Timeout:    60, // Default timeout of 60 seconds
	}

	res, err := a.mcpClient.ExecuteCommand(ctx, req)
	if err != nil {
		return "", "", err
	}

	return res.Output, res.Error, nil
}
