package middleware

import (
	"context"
	log "packages/logging"
	"net/http"
	"time"

	"core/internal/oauth"
	"core/internal/session"
	"core/models"

	"packages/utils/json"

	"golang.org/x/oauth2"
)

type contextKey string

const UserContextKey contextKey = "user"

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenInfo, err := session.GetSession(r)
		if err != nil || tokenInfo == nil {
			json.WriteError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		// Handle OAuth token refresh (skip for magic link sessions)
		if tokenInfo.Token != nil {
			// Check if token is expired
			if time.Now().After(tokenInfo.ExpiresAt) {
				// Try to refresh token
				newToken, err := refreshToken(tokenInfo.Token)
				if err != nil {
					log.Error("Refresh token failed", "error", err)
					session.ClearSession(w, r)
					json.WriteError(w, http.StatusUnauthorized, "Token expired")
					return
				}
				// Update token info
				tokenInfo.Token = newToken
				tokenInfo.ExpiresAt = newToken.Expiry
				// Save updated session
				if err := session.SaveSession(w, r, tokenInfo); err != nil {
					log.Error("Save refreshed session failed", "error", err)
					json.WriteError(w, http.StatusInternalServerError, "Internal server error")
					return
				}
			}
		} else {
			// For magic link sessions, check if session is expired
			if time.Now().After(tokenInfo.ExpiresAt) {
				session.ClearSession(w, r)
				json.WriteError(w, http.StatusUnauthorized, "Session expired")
				return
			}
		}

		// Add user to context
		ctx := context.WithValue(r.Context(), UserContextKey, tokenInfo.User)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func refreshToken(token *oauth2.Token) (*oauth2.Token, error) {
	tokenSource := oauth.GithubOauthConfig.TokenSource(context.Background(), token)
	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, err
	}
	return newToken, nil
}

func GetUserFromContext(ctx context.Context) (*models.User, bool) {
	user, ok := ctx.Value(UserContextKey).(*models.User)
	return user, ok
}
