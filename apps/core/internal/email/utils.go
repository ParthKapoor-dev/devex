package email

import (
	"fmt"
	"net/http"
	"net/mail"
	"strings"
	"time"

	"core/internal/session"
	"core/pkg/dotenv"
)

const (
	TokenLength     = 32
	TokenLifetime   = 15 * time.Minute
	RateLimitWindow = 1 * time.Minute
	MaxAttempts     = 3
)

func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return fmt.Errorf("email is required")
	}

	_, err := mail.ParseAddress(email)
	if err != nil {
		return fmt.Errorf("invalid email format: %v", err)
	}

	return nil
}

func CheckRateLimit(r *http.Request, email string) error {
	// Get session for rate limiting
	session, err := session.Store.Get(r, "rate-limit")
	if err != nil {
		return nil // Allow if we can't get session
	}

	key := fmt.Sprintf("magic-link:%s", email)
	now := time.Now()

	// Get existing attempts
	if data, exists := session.Values[key]; exists {
		if attempts, ok := data.(map[string]any); ok {
			if lastAttempt, ok := attempts["last_attempt"].(time.Time); ok {
				if count, ok := attempts["count"].(int); ok {
					// Reset counter if window expired
					if now.Sub(lastAttempt) > RateLimitWindow {
						count = 0
					}

					if count >= MaxAttempts {
						return fmt.Errorf("rate limit exceeded")
					}

					// Update counter
					attempts["count"] = count + 1
					attempts["last_attempt"] = now
				}
			}
		}
	} else {
		// First attempt
		session.Values[key] = map[string]any{
			"count":        1,
			"last_attempt": now,
		}
	}

	session.Options.MaxAge = int(RateLimitWindow.Seconds())
	session.Save(r, nil)
	return nil
}

// Message is a ready-to-send transactional email.
//
// Both parts are always populated: some clients, and most spam filters, treat a
// missing text/plain alternative as a negative signal.
type Message struct {
	Subject string
	HTML    string
	Text    string
}

// GenerateMagicLink builds the sign-in email for the given address and token.
//
// The subject deliberately omits urgency words and emoji — both are spam
// triggers, and this mail must reach the inbox to be useful at all.
func GenerateMagicLink(recipient, token string) (Message, error) {
	base := dotenv.EnvString("MAGICLINK_REDIRECT_URL", "http://localhost:8080/auth/magiclink/verify")

	magicLink, err := buildMagicLinkURL(base, token)
	if err != nil {
		return Message{}, err
	}

	data := newMagicLinkData(recipient, magicLink)

	htmlBody, err := renderMagicLink("magiclink.html.tmpl", data)
	if err != nil {
		return Message{}, err
	}

	textBody, err := renderMagicLink("magiclink.txt.tmpl", data)
	if err != nil {
		return Message{}, err
	}

	return Message{
		Subject: "Sign in to DevEx",
		HTML:    htmlBody,
		Text:    textBody,
	}, nil
}

func ExtractNameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) > 0 {
		return parts[0]
	}
	return email
}
