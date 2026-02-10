package auth

import (
	"encoding/json"
	log "packages/logging"
	"net/http"

	sessionManager "core/internal/session"
	"core/pkg/resend"
)

func NewAuthHandler() http.Handler {
	mux := http.NewServeMux()
	resend := resend.NewClient()

	mux.HandleFunc("GET /github/login", githubLoginHandler)
	mux.HandleFunc("GET /github/callback", githubCallbackHandler)

	mux.HandleFunc("POST /magiclink/login", func(w http.ResponseWriter, r *http.Request) {
		magiclinkLoginHandler(w, r, resend)
	})
	mux.HandleFunc("GET /magiclink/verify", magiclinkCallbackHandler)

	mux.HandleFunc("POST /logout", logoutHandler)
	mux.HandleFunc("GET /me", meHandler)
	mux.HandleFunc("GET /status", statusHandler)

	return mux
}

func logoutHandler(w http.ResponseWriter, r *http.Request) {
	if err := sessionManager.ClearSession(w, r); err != nil {
		log.Error("Clear session failed", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Logged out successfully"})
}

func meHandler(w http.ResponseWriter, r *http.Request) {
	tokenInfo, err := sessionManager.GetSession(r)
	if err != nil || tokenInfo == nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tokenInfo.User)
}

func statusHandler(w http.ResponseWriter, r *http.Request) {
	isAuth := sessionManager.IsAuthenticated(r)

	response := map[string]any{
		"authenticated": isAuth,
	}

	if isAuth {
		tokenInfo, err := sessionManager.GetSession(r)
		if err == nil && tokenInfo != nil {
			response["user"] = tokenInfo.User
			response["token_expires_at"] = tokenInfo.ExpiresAt
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
