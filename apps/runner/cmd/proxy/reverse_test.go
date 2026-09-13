package proxy

import (
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"sync/atomic"
	"testing"
)

func TestReverseProxyHandlerRejectsInvalidPath(t *testing.T) {
	tests := []struct {
		name string
		path string
	}{
		{"no port segment", "/user-app"},
		{"non-numeric port", "/user-app/abc/index.html"},
		{"empty port", "/user-app//index.html"},
		{"privileged port", "/user-app/80/"},
		{"just below 1024", "/user-app/1023/"},
		{"negative port", "/user-app/-5000/"},
		{"above 65535", "/user-app/65536/"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "http://runner"+tt.path, nil)
			rec := httptest.NewRecorder()

			ReverseProxyHandler(rec, req)

			if rec.Code != http.StatusBadRequest {
				t.Errorf("GET %s: status = %d, want %d", tt.path, rec.Code, http.StatusBadRequest)
			}
		})
	}
}

func TestReverseProxyHandlerProxiesToPort(t *testing.T) {
	type seen struct {
		path  string
		query string
	}
	var last atomic.Pointer[seen]
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		last.Store(&seen{path: r.URL.Path, query: r.URL.RawQuery})
		w.Header().Set("X-Backend", "yes")
		w.WriteHeader(http.StatusTeapot)
		fmt.Fprintf(w, "%s %s", r.Method, r.URL.Path)
	}))
	defer backend.Close()

	u, err := url.Parse(backend.URL)
	if err != nil {
		t.Fatal(err)
	}
	port, err := strconv.Atoi(u.Port())
	if err != nil {
		t.Fatal(err)
	}
	if port < 1024 {
		t.Skipf("backend got port %d, the proxy only accepts ports >= 1024", port)
	}

	tests := []struct {
		name      string
		path      string
		wantPath  string
		wantQuery string
	}{
		{"nested path", fmt.Sprintf("/user-app/%d/api/items/42", port), "/api/items/42", ""},
		{"query string kept", fmt.Sprintf("/user-app/%d/search?q=go&page=2", port), "/search", "q=go&page=2"},
		{"trailing slash", fmt.Sprintf("/user-app/%d/", port), "/", ""},
		{"no trailing slash", fmt.Sprintf("/user-app/%d", port), "/", ""},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			last.Store(nil)
			req := httptest.NewRequest(http.MethodGet, "http://runner"+tt.path, nil)
			rec := httptest.NewRecorder()

			ReverseProxyHandler(rec, req)

			if rec.Code != http.StatusTeapot {
				t.Fatalf("status = %d, want %d (body %q)", rec.Code, http.StatusTeapot, rec.Body.String())
			}
			if rec.Header().Get("X-Backend") != "yes" {
				t.Error("backend response header not forwarded")
			}
			body, _ := io.ReadAll(rec.Body)
			if want := "GET " + tt.wantPath; string(body) != want {
				t.Errorf("body = %q, want %q", body, want)
			}
			got := last.Load()
			if got == nil {
				t.Fatal("backend was not called")
			}
			if got.path != tt.wantPath || got.query != tt.wantQuery {
				t.Errorf("backend saw path=%q query=%q, want path=%q query=%q", got.path, got.query, tt.wantPath, tt.wantQuery)
			}
		})
	}
}
