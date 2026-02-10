package server

import (
	log "packages/logging"
	"mcp/internal/gRPC"
	"mcp/internal/tools"
	"net/http"

	"github.com/modelcontextprotocol/go-sdk/mcp"
)

type McpServer struct {
	server     *mcp.Server
	replClient *gRPC.ReplClient
	tools      *tools.ToolsHandler
	httpAddr   string
}

func NewMcpServer() *McpServer {

	defer log.Info("Created MCP server instance")

	server := mcp.NewServer(&mcp.Implementation{
		Name:    "DevEx MCP Server",
		Version: "v1.0.0",
	}, nil)

	replClient, err := gRPC.NewReplClient()
	if err != nil {
		log.Error("Repl client error", "error", err)
	}

	tools := tools.NewToolsHandler(replClient)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "Ping",
		Description: "Ping the MCP Server",
	}, tools.Ping)

	mcp.AddTool(server, &mcp.Tool{
		Name:        "read_file",
		Description: "Read the contents of a file in the workspace",
	}, tools.ReadFile)

	// File System Tools
	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "read_file",
	// 	Description: "Read the contents of a file in the workspace",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The path to the file relative to workspace root",
	// 			},
	// 		},
	// 		Required: []string{"path"},
	// 	},
	// }, toolsHandler.ReadFile)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "write_file",
	// 	Description: "Write content to a file in the workspace",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The path to the file relative to workspace root",
	// 			},
	// 			"content": map[string]any{
	// 				"type":        "string",
	// 				"description": "The content to write to the file",
	// 			},
	// 		},
	// 		Required: []string{"path", "content"},
	// 	},
	// }, toolsHandler.WriteFile)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "list_files",
	// 	Description: "List files and directories in a given path",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The path to list (empty for root)",
	// 				"default":     "",
	// 			},
	// 		},
	// 	},
	// }, toolsHandler.ListFiles)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "create_file",
	// 	Description: "Create a new file in the workspace",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The path for the new file",
	// 			},
	// 		},
	// 		Required: []string{"path"},
	// 	},
	// }, toolsHandler.CreateFile)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "create_folder",
	// 	Description: "Create a new folder in the workspace",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The path for the new folder",
	// 			},
	// 		},
	// 		Required: []string{"path"},
	// 	},
	// }, toolsHandler.CreateFolder)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "delete",
	// 	Description: "Delete a file or folder from the workspace",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The path to delete",
	// 			},
	// 		},
	// 		Required: []string{"path"},
	// 	},
	// }, toolsHandler.Delete)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "rename",
	// 	Description: "Rename or move a file or folder",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"old_path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The current path",
	// 			},
	// 			"new_path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The new path",
	// 			},
	// 		},
	// 		Required: []string{"old_path", "new_path"},
	// 	},
	// }, toolsHandler.Rename)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "copy",
	// 	Description: "Copy a file or folder",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"source_path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The source path",
	// 			},
	// 			"target_path": map[string]any{
	// 				"type":        "string",
	// 				"description": "The target path",
	// 			},
	// 		},
	// 		Required: []string{"source_path", "target_path"},
	// 	},
	// }, toolsHandler.Copy)

	// Terminal Tools
	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "execute_command",
	// 	Description: "Execute a command in the terminal and return the output",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"command": map[string]any{
	// 				"type":        "string",
	// 				"description": "The command to execute",
	// 			},
	// 			"working_dir": map[string]any{
	// 				"type":        "string",
	// 				"description": "Working directory for the command (optional)",
	// 				"default":     "",
	// 			},
	// 			"timeout": map[string]any{
	// 				"type":        "integer",
	// 				"description": "Timeout in seconds (default: 30)",
	// 				"default":     30,
	// 			},
	// 		},
	// 		Required: []string{"command"},
	// 	},
	// }, toolsHandler.ExecuteCommand)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "create_terminal",
	// 	Description: "Create a new persistent terminal session",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"name": map[string]any{
	// 				"type":        "string",
	// 				"description": "Name for the terminal session (optional)",
	// 				"default":     "",
	// 			},
	// 		},
	// 	},
	// }, toolsHandler.CreateTerminal)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "send_to_terminal",
	// 	Description: "Send input to a persistent terminal session",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"session_id": map[string]any{
	// 				"type":        "string",
	// 				"description": "The terminal session ID",
	// 			},
	// 			"input": map[string]any{
	// 				"type":        "string",
	// 				"description": "The input to send to the terminal",
	// 			},
	// 		},
	// 		Required: []string{"session_id", "input"},
	// 	},
	// }, toolsHandler.SendToTerminal)

	// mcp.AddTool(server, &mcp.Tool{
	// 	Name:        "close_terminal",
	// 	Description: "Close a persistent terminal session",
	// 	InputSchema: mcp.ToolInputSchema{
	// 		Type: "object",
	// 		Properties: map[string]any{
	// 			"session_id": map[string]any{
	// 				"type":        "string",
	// 				"description": "The terminal session ID",
	// 			},
	// 		},
	// 		Required: []string{"session_id"},
	// 	},
	// }, toolsHandler.CloseTerminal)

	return &McpServer{
		server:   server,
		tools:    tools,
		httpAddr: ":8080",
	}
}

func (m *McpServer) Run() error {
	log.Info("MCP server starting", "addr", m.httpAddr)
	defer log.Info("MCP server shutting down", "addr", m.httpAddr)

	handler := mcp.NewStreamableHTTPHandler(func(*http.Request) *mcp.Server {
		return m.server
	}, nil)

	http.ListenAndServe(m.httpAddr, handler)
	return nil
}
