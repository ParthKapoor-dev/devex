package api

import (
	"fmt"
	"log"
	"net/http"
	"sync"

	"github.com/parthkapoor-dev/core/cmd/middleware"
	"github.com/parthkapoor-dev/core/internal/k8s"
	"github.com/parthkapoor-dev/core/internal/redis"
	"github.com/parthkapoor-dev/core/internal/s3"
	"github.com/parthkapoor-dev/core/pkg/dotenv"
	"github.com/parthkapoor-dev/core/pkg/json"
	"github.com/parthkapoor-dev/core/services/auth"
	"github.com/parthkapoor-dev/core/services/repl"
	"github.com/parthkapoor-dev/core/services/runner"
	"github.com/rs/cors"
)

var FRONTEND_URL = dotenv.EnvString("FRONTEND_URL", "*")

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
	rds := redis.NewRedisStore()

	router.HandleFunc("GET /ping", func(w http.ResponseWriter, r *http.Request) {
		var mu sync.Mutex
		var wg sync.WaitGroup
		wg.Add(3)
		status := map[string]string{
			"api":   "ok",
			"k8s":   "ok",
			"s3":    "ok",
			"redis": "ok",
		}

		go func() {
			defer wg.Done()
			if err := rds.Ping(); err != nil {
				mu.Lock()
				status["api"] = "degraded"
				status["redis"] = fmt.Sprintf("%v", err)
				mu.Unlock()
			}
		}()

		go func() {
			defer wg.Done()
			if err := s3Client.Ping(); err != nil {
				mu.Lock()
				status["api"] = "degraded"
				status["s3"] = fmt.Sprintf("%v", err)
				mu.Unlock()
			}
		}()

		go func() {
			defer wg.Done()
			if _, err := k8s.CheckStatus(); err != nil {
				mu.Lock()
				status["api"] = "degraded"
				status["k8s"] = fmt.Sprintf("%v", err)
				mu.Unlock()
			}
		}()

		wg.Wait()

		json.WriteJSON(w, http.StatusOK, status)
	})

	//  Auth Routes
	router.Handle("/auth/", http.StripPrefix("/auth", auth.NewAuthHandler()))

	// Runner Routes
	router.Handle("/api/runner/", http.StripPrefix("/api/runner", runner.NewHandler(rds)))

	// Protected Repl Routes
	router.Handle("/api/repl/", middleware.AuthMiddleware(
		http.StripPrefix("/api/repl", repl.NewHandler(s3Client, rds))))

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{FRONTEND_URL, "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	})

	server := http.Server{
		Addr:    api.addr,
		Handler: c.Handler(router),
	}

	log.Println("Server has started at ", api.addr)
	return server.ListenAndServe()
}
