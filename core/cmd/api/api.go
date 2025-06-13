package api

import (
	"log"
	"net/http"

	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/services/auth"
	"github.com/parthkapoor-dev/core/services/repl"
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
	s3Client := s3.NewS3Client()

	router.Handle("/api/v1/auth/", http.StripPrefix("/api/v1/auth", auth.NewHandler()))
	router.Handle("/api/v1/repl/", http.StripPrefix("/api/v1/repl", repl.NewHandler(s3Client)))

	server := http.Server{
		Addr:    api.addr,
		Handler: router,
	}

	log.Println("Server has started at ", api.addr)
	return server.ListenAndServe()
}
