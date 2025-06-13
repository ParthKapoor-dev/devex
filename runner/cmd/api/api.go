package api

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/runner/services/repl"
)

type APIServer struct {
	addr string
}

func NewAPIServer(addr string) *APIServer {
	return &APIServer{
		addr: addr,
	}
}

func (api *APIServer) Run() error {

	router := http.NewServeMux()

	router.Handle("/api/v1/repl/", http.StripPrefix("/api/v1/repl", repl.NewHandler()))

	server := http.Server{
		Addr:    api.addr,
		Handler: router,
	}

	log.Println("Server has started at ", api.addr)
	return server.ListenAndServe()
}
