package api

import (
	"log"
	"net/http"
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

	router.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Got Hello World at Agent API")
	})

	server := http.Server{
		Handler: router,
		Addr:    api.addr,
	}

	log.Println("App Running at Addr:", api.addr)
	return server.ListenAndServe()
}
