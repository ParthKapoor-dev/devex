package main

import (
	log "packages/logging"
	"mcp/cmd/server"
)

func main() {
	log.Init("mcp")
	if err := server.NewMcpServer().Run(); err != nil {
		log.Error("MCP server exited with error", "error", err)
	}
	log.Info("Bye")
}
