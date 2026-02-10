package api

import (
	"context"
	"fmt"
	log "packages/logging"
	"net"
	"net/http"
	"packages/utils/json"
	"runner/cmd/proxy"
	"runner/pkg/dotenv"
	"runner/pkg/shutdown"
	"runner/services/mcp"
	"runner/services/repl"

	"github.com/rs/cors"
	"golang.org/x/sync/errgroup"
)

type APIServer struct {
	httpAddr string
	grpcAddr string
}

func NewAPIServer(httpAddr, grpcAddr string) *APIServer {
	return &APIServer{
		httpAddr: httpAddr,
		grpcAddr: grpcAddr,
	}
}

func (api *APIServer) Run() error {

	g, _ := errgroup.WithContext(context.Background())

	g.Go(api.RunGRPC)
	g.Go(api.RunHTTP)

	return g.Wait()
}

func (api *APIServer) RunGRPC() error {

	lis, err := net.Listen("tcp", api.grpcAddr)
	if err != nil {
		return err
	}

	mcp.NewGrpcServer(lis)
	return nil

}

func (api *APIServer) RunHTTP() error {

	router := http.NewServeMux()
	sm := shutdown.NewShutdownManager(dotenv.EnvString("REPL_ID", "repl_id_not_found"), shutdownCallback)

	// background repl services
	router.Handle("/api/v1/repl/", http.StripPrefix("/api/v1/repl", repl.NewHandler(sm)))

	// user app usage
	router.HandleFunc("/user-app/", proxy.ReverseProxyHandler)

	router.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		log.Debug("Ping", "route", "/ping")
		json.WriteJSON(w, http.StatusOK, "pong")
	})

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})
	server := http.Server{
		Addr:    api.httpAddr,
		Handler: c.Handler(router),
	}

	log.Info("Server started", "addr", api.httpAddr)
	return server.ListenAndServe()
}
