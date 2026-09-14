package auth

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	sessionManager "core/internal/session"
	"core/models"
)

func loggedInCookies(t *testing.T, user *models.User) []*http.Cookie {
	t.Helper()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	tokenInfo := &models.TokenInfo{User: user, ExpiresAt: time.Now().Add(time.Hour)}
	if err := sessionManager.SaveSession(rec, req, tokenInfo); err != nil {
		t.Fatalf("SaveSession: %v", err)
	}
	return rec.Result().Cookies()
}

func request(h http.Handler, method, target string, cookies []*http.Cookie) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func findCookie(cookies []*http.Cookie, name string) *http.Cookie {
	for _, c := range cookies {
		if c.Name == name {
			return c
		}
	}
	return nil
}

func TestMe(t *testing.T) {
	h := NewAuthHandler()

	t.Run("without session", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/me", nil)
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("status = %d, want 401", rec.Code)
		}
	})

	t.Run("with session", func(t *testing.T) {
		cookies := loggedInCookies(t, &models.User{Id: "gh:7", Login: "octocat", Email: "octo@example.com"})

		rec := request(h, http.MethodGet, "/me", cookies)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
		}
		var got models.User
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Fatalf("decode %s: %v", rec.Body, err)
		}
		if got.Id != "gh:7" || got.Login != "octocat" || got.Email != "octo@example.com" {
			t.Errorf("user = %+v", got)
		}
	})
}

func TestStatus(t *testing.T) {
	h := NewAuthHandler()

	type statusResponse struct {
		Authenticated bool         `json:"authenticated"`
		User          *models.User `json:"user"`
	}

	t.Run("without session", func(t *testing.T) {
		rec := request(h, http.MethodGet, "/status", nil)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d", rec.Code)
		}
		var got statusResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Fatalf("decode %s: %v", rec.Body, err)
		}
		if got.Authenticated || got.User != nil {
			t.Errorf("response = %+v, want unauthenticated with no user", got)
		}
	})

	t.Run("with session", func(t *testing.T) {
		cookies := loggedInCookies(t, &models.User{Login: "octocat"})

		rec := request(h, http.MethodGet, "/status", cookies)

		var got statusResponse
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Fatalf("decode %s: %v", rec.Body, err)
		}
		if !got.Authenticated || got.User == nil || got.User.Login != "octocat" {
			t.Errorf("response = %s, want authenticated as octocat", rec.Body)
		}
	})
}

func TestLogout(t *testing.T) {
	h := NewAuthHandler()
	cookies := loggedInCookies(t, &models.User{Login: "octocat"})

	rec := request(h, http.MethodPost, "/logout", cookies)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body = %s", rec.Code, rec.Body)
	}
	c := findCookie(rec.Result().Cookies(), sessionManager.SessionName)
	if c == nil || c.MaxAge >= 0 {
		t.Errorf("session cookie = %+v, want it expired", c)
	}
}

func TestGitHubLogin(t *testing.T) {
	h := NewAuthHandler()

	rec := request(h, http.MethodGet, "/github/login", nil)

	if rec.Code != http.StatusTemporaryRedirect {
		t.Fatalf("status = %d, want 307", rec.Code)
	}
	loc, err := url.Parse(rec.Header().Get("Location"))
	if err != nil {
		t.Fatalf("Location: %v", err)
	}
	if loc.Host != "github.com" || loc.Path != "/login/oauth/authorize" {
		t.Errorf("redirect = %s, want github.com/login/oauth/authorize", loc)
	}
	state := loc.Query().Get("state")
	if state == "" {
		t.Fatal("redirect has no state parameter")
	}

	stateCookie := findCookie(rec.Result().Cookies(), "oauth-state")
	if stateCookie == nil {
		t.Fatal("oauth-state cookie not set")
	}
	if stateCookie.MaxAge != 600 {
		t.Errorf("oauth-state MaxAge = %d, want 600", stateCookie.MaxAge)
	}

	// The cookie must carry the same state the callback will compare against.
	req := httptest.NewRequest(http.MethodGet, "/github/callback", nil)
	req.AddCookie(stateCookie)
	sess, err := sessionManager.Store.Get(req, "oauth-state")
	if err != nil {
		t.Fatalf("decode oauth-state: %v", err)
	}
	if got := sess.Values["state"]; got != state {
		t.Errorf("state in cookie = %v, want %q", got, state)
	}

	// Each login gets its own state.
	again := request(h, http.MethodGet, "/github/login", nil)
	if loc2, _ := url.Parse(again.Header().Get("Location")); loc2.Query().Get("state") == state {
		t.Error("two logins produced the same state")
	}
}

func TestGitHubCallbackInvalidState(t *testing.T) {
	t.Setenv("FRONTEND_URL", "http://frontend.test")
	h := NewAuthHandler()

	login := request(h, http.MethodGet, "/github/login", nil)
	stateCookie := findCookie(login.Result().Cookies(), "oauth-state")
	if stateCookie == nil {
		t.Fatal("oauth-state cookie not set")
	}

	cases := []struct {
		name    string
		target  string
		cookies []*http.Cookie
	}{
		{name: "mismatched state", target: "/github/callback?state=wrong&code=abc", cookies: []*http.Cookie{stateCookie}},
		{name: "missing state cookie", target: "/github/callback?state=wrong&code=abc", cookies: nil},
		{name: "missing state param", target: "/github/callback?code=abc", cookies: []*http.Cookie{stateCookie}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := request(h, http.MethodGet, tc.target, tc.cookies)

			if rec.Code != http.StatusTemporaryRedirect {
				t.Fatalf("status = %d, want 307", rec.Code)
			}
			if got, want := rec.Header().Get("Location"), "http://frontend.test?error=invalid_state"; got != want {
				t.Errorf("Location = %q, want %q", got, want)
			}
			if findCookie(rec.Result().Cookies(), sessionManager.SessionName) != nil {
				t.Error("callback with invalid state set a session cookie")
			}
		})
	}
}
