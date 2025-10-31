package main

import (
	"agent/cmd/api"
	"log"
)

func main() {

	// TODO: Set Port from dotenv here
	// port := dotenv.EnvString("PORT", "8080")
	port := "8089"
	server := api.NewAPIServer(":" + port)

	if err := server.Run(); err != nil {
		log.Println(err)
	}
}
