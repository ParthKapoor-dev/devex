package main

import (
	log "packages/logging"
	"runner/cmd/api"
)

func main() {
	log.Init("runner")
	if err := api.NewAPIServer(":8081", ":50051").Run(); err != nil {
		log.Fatal("Server exited with error", "error", err)
	}
}
