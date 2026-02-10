package mcp

import (
	"context"
	"fmt"
	log "packages/logging"
	"net"
	"packages/pb"
	"runner/pkg/fs"

	"google.golang.org/grpc"
)

type grpcServer struct {
	pb.UnimplementedReplServiceServer
}

func NewGrpcServer(lis net.Listener) error {
	server := grpc.NewServer()
	pb.RegisterReplServiceServer(server, &grpcServer{})

	log.Info("Starting gRPC server", "addr", ":50051")
	return server.Serve(lis)
}

func (s *grpcServer) FetchContent(ctx context.Context, in *pb.FetchContentRequest) (*pb.FetchContentResponse, error) {

	fullPath := fmt.Sprintf("/workspaces/%s", in.Path)
	data, err := fs.FetchFileContent(fullPath)
	if err != nil {
		log.Error("Fetch file content failed", "path", in.Path, "full_path", fullPath, "error", err)
		return nil, err
	}

	return &pb.FetchContentResponse{
		Content: data,
	}, nil

}
