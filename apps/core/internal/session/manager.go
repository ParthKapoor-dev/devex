// internal/session/manager.go
package session

import (
	"encoding/json"
	"net/http"

	"core/models"
	"core/pkg/dotenv"

	"github.com/gorilla/sessions"
)

const SessionName = "oauth-session"

var Store = sessions.NewCookieStore([]byte(dotenv.EnvString("SESSION_SECRET", "dont-use-this-in-prod")))

func init() {
	Store.Options = &sessions.Options{
		Path:     "/",
		MaxAge:   86400 * 7, // 7 days
		HttpOnly: true,
		Secure:   dotenv.EnvString("ENVIRONMENT", "development") == "production",
		SameSite: http.SameSiteLaxMode,
	}
}

func SaveSession(w http.ResponseWriter, r *http.Request, tokenInfo *models.TokenInfo) error {
	session, err := Store.Get(r, SessionName)
	if err != nil {
		return err
	}

	sessionData, err := json.Marshal(tokenInfo)
	if err != nil {
		return err
	}

	session.Values["token_info"] = string(sessionData)
	session.Values["user_id"] = tokenInfo.User.Id
	session.Values["authenticated"] = true

	return session.Save(r, w)
}

func GetSession(r *http.Request) (*models.TokenInfo, error) {
	session, err := Store.Get(r, SessionName)
	if err != nil {
		return nil, err
	}

	tokenInfoStr, ok := session.Values["token_info"].(string)
	if !ok {
		return nil, err
	}

	var tokenInfo models.TokenInfo
	if err := json.Unmarshal([]byte(tokenInfoStr), &tokenInfo); err != nil {
		return nil, err
	}

	return &tokenInfo, nil
}

func ClearSession(w http.ResponseWriter, r *http.Request) error {
	session, err := Store.Get(r, SessionName)
	if err != nil {
		return err
	}

	session.Values = make(map[any]any)
	session.Options.MaxAge = -1

	return session.Save(r, w)
}

func IsAuthenticated(r *http.Request) bool {
	session, err := Store.Get(r, SessionName)
	if err != nil {
		return false
	}

	auth, ok := session.Values["authenticated"].(bool)
	return ok && auth
}
