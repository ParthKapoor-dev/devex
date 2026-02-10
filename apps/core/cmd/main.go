package main

import (
	log "packages/logging"
	"core/cmd/api"
	"core/pkg/dotenv"
)

func main() {
	log.Init("core")

	port := dotenv.EnvString("PORT", "8080")
	server := api.NewAPIServer(":" + port)

	if err := server.Run(); err != nil {
		log.Error("Server exited with error", "error", err)
	}
}
