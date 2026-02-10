package auth

import (
	"encoding/json"
	"fmt"
	log "packages/logging"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"core/internal/email"
	sessionManager "core/internal/session"
	"core/models"
	"core/pkg/dotenv"
	"core/pkg/resend"
)

type MagicLinkData struct {
	Token     string    `json:"token"`
	Email     string    `json:"email"`
	ExpiresAt time.Time `json:"expires_at"`
}

type LoginRequest struct {
	Email string `json:"email"`
}

type LoginResponse struct {
	Message string `json:"message"`
	Success bool   `json:"success"`
}

const (
	TokenLength     = 32
	TokenLifetime   = 15 * time.Minute
	RateLimitWindow = 1 * time.Minute
	MaxAttempts     = 3
)

func magiclinkLoginHandler(w http.ResponseWriter, r *http.Request, resend *resend.Resend) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Warn("Decode login request failed", "error", err)
		writeError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Validate email
	if err := email.ValidateEmail(req.Email); err != nil {
		log.Warn("Invalid email", "email", req.Email, "error", err)
		writeError(w, http.StatusBadRequest, "Invalid email address")
		return
	}

	// Normalize email
	norm_email := strings.ToLower(strings.TrimSpace(req.Email))

	// Check rate limiting
	if err := email.CheckRateLimit(r, norm_email); err != nil {
		log.Warn("Rate limit exceeded", "email", norm_email, "error", err)
		writeError(w, http.StatusTooManyRequests, "Too many requests. Please try again later.")
		return
	}

	// Generate secure token
	token, err := email.GenerateToken(req.Email)
	if err != nil {
		log.Error("Generate token failed", "email", norm_email, "error", err)
		writeError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	// Send magic link email
	subject, body := email.GenerateMagicLink(norm_email, token)
	if err := resend.SendEmail(norm_email, subject, body); err != nil {
		log.Error("Send magic link email failed", "email", norm_email, "error", err)
		writeError(w, http.StatusInternalServerError, "Failed to send magic link")
		return
	}

	// Always return success to prevent email enumeration
	writeJSON(w, LoginResponse{
		Message: "Magic link sent! Check your email and click the link to sign in.",
		Success: true,
	})
}

func magiclinkCallbackHandler(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		log.Warn("Missing token in verification request")
		redirectWithError(w, r, "missing_token")
		return
	}

	validatedEmail, err := email.ValidateToken(token)
	if err != nil {
		log.Warn("Validate token failed", "error", err)
		redirectWithError(w, r, "invalid_token")
		return
	}
	name := email.ExtractNameFromEmail(validatedEmail)

	// TODO: Complete User Info
	user := &models.User{
		Name:      name,
		Login:     name,
		Email:     validatedEmail,
		AvatarURL: getAvatarUrl(),
		CreatedAt: time.Now(),
	}

	// Create token info for session (magic link doesn't use OAuth tokens)
	tokenInfo := &models.TokenInfo{
		Token:     nil, // No OAuth token for magic link
		User:      user,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24 hour session
	}

	// Save session
	if err := sessionManager.SaveSession(w, r, tokenInfo); err != nil {
		log.Error("Save session failed", "error", err)
		redirectWithError(w, r, "session_save_failed")
		return
	}

	// Redirect to frontend dashboard
	frontendURL := dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")
	http.Redirect(w, r, frontendURL+"/dashboard", http.StatusTemporaryRedirect)
}

// Helper methods
func redirectWithError(w http.ResponseWriter, r *http.Request, errorType string) {
	frontendURL := dotenv.EnvString("FRONTEND_URL", "http://localhost:3000")
	http.Redirect(w, r, fmt.Sprintf("%s?error=%s", frontendURL, errorType), http.StatusTemporaryRedirect)
}

func writeJSON(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Error("Encode JSON response failed", "error", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func writeError(w http.ResponseWriter, statusCode int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func getAvatarUrl() string {
	items := []string{
		"https://i.imgur.com/s7OesTE.png", "https://i.imgur.com/VBq30D6.png",
		"https://i.imgur.com/jIduwzv.png", "https://i.imgur.com/YvQx6FN.png",
		"https://i.imgur.com/r3m3hf6.png", "https://i.imgur.com/h60wtoz.png",
		"https://i.imgur.com/OtlH2uM.png", "https://i.imgur.com/aNQLbGl.png",
	}

	// Create a local random generator seeded with the current time
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	return items[r.Intn(len(items))]
}
