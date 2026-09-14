package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"core/internal/session"
	"core/models"

	"golang.org/x/oauth2"
)

// sessionCookies runs tokenInfo through the real session store and returns
// the cookies a browser would send back.
func sessionCookies(t *testing.T, tokenInfo *models.TokenInfo) []*http.Cookie {
	t.Helper()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	if err := session.SaveSession(rec, req, tokenInfo); err != nil {
		t.Fatalf("SaveSession: %v", err)
	}
	cookies := rec.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("SaveSession set no cookie")
	}
	return cookies
}

// serve runs a request with the given cookies through AuthMiddleware and
// reports the user the next handler saw, if it was reached.
func serve(t *testing.T, cookies []*http.Cookie) (*httptest.ResponseRecorder, *models.User, bool) {
	t.Helper()
	var (
		gotUser *models.User
		reached bool
	)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reached = true
		user, ok := GetUserFromContext(r.Context())
		if !ok {
			t.Error("next handler has no user in context")
		}
		gotUser = user
		w.WriteHeader(http.StatusTeapot)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/repl/", nil)
	for _, c := range cookies {
		req.AddCookie(c)
	}
	rec := httptest.NewRecorder()
	AuthMiddleware(next).ServeHTTP(rec, req)
	return rec, gotUser, reached
}

func TestAuthMiddlewareNoSession(t *testing.T) {
	rec, _, reached := serve(t, nil)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if reached {
		t.Error("next handler was called without a session")
	}
}

func TestAuthMiddlewareMagicLinkSession(t *testing.T) {
	user := &models.User{Login: "dev", Email: "dev@example.com"}
	cookies := sessionCookies(t, &models.TokenInfo{User: user, ExpiresAt: time.Now().Add(time.Hour)})

	rec, gotUser, reached := serve(t, cookies)

	if !reached {
		t.Fatalf("next handler not called, status = %d body = %s", rec.Code, rec.Body)
	}
	if rec.Code != http.StatusTeapot {
		t.Errorf("status = %d, want the next handler's 418", rec.Code)
	}
	if gotUser == nil || gotUser.Login != "dev" || gotUser.Email != "dev@example.com" {
		t.Errorf("user in context = %+v, want %+v", gotUser, user)
	}
}

func TestAuthMiddlewareExpiredMagicLinkSession(t *testing.T) {
	user := &models.User{Login: "dev"}
	cookies := sessionCookies(t, &models.TokenInfo{User: user, ExpiresAt: time.Now().Add(-time.Minute)})

	rec, _, reached := serve(t, cookies)

	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if reached {
		t.Error("next handler was called with an expired session")
	}
	assertSessionCleared(t, rec)
}

func TestAuthMiddlewareGitHubSession(t *testing.T) {
	expiry := time.Now().Add(time.Hour)
	user := &models.User{Id: "gh:42", Login: "octocat"}
	cookies := sessionCookies(t, &models.TokenInfo{
		Token:     &oauth2.Token{AccessToken: "test-access-token", TokenType: "bearer", Expiry: expiry},
		User:      user,
		ExpiresAt: expiry,
	})

	rec, gotUser, reached := serve(t, cookies)

	if !reached {
		t.Fatalf("next handler not called, status = %d body = %s", rec.Code, rec.Body)
	}
	if gotUser == nil || gotUser.Id != "gh:42" || gotUser.Login != "octocat" {
		t.Errorf("user in context = %+v, want %+v", gotUser, user)
	}
}

func TestGetUserFromContextEmpty(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	if user, ok := GetUserFromContext(req.Context()); ok || user != nil {
		t.Errorf("GetUserFromContext on empty context = %+v, %v", user, ok)
	}
}

func assertSessionCleared(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	for _, c := range rec.Result().Cookies() {
		if c.Name == session.SessionName {
			if c.MaxAge >= 0 {
				t.Errorf("session cookie MaxAge = %d, want it expired", c.MaxAge)
			}
			return
		}
	}
	t.Error("response does not clear the session cookie")
}
