package repl

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"testing"
	"time"

	"runner/pkg/pty"
	"runner/pkg/shutdown"
	"runner/pkg/ws"

	"github.com/gorilla/websocket"
	"github.com/sergi/go-diff/diffmatchpatch"
)

const waitTimeout = 5 * time.Second

// client is a WebSocket test client. A single goroutine reads every message
// into events, so waits can time out without breaking the connection (a
// gorilla read deadline leaves the connection unusable).
type client struct {
	conn   *websocket.Conn
	events chan ws.Message
}

func (c *client) send(t *testing.T, event string, data any) {
	t.Helper()
	if err := c.conn.WriteJSON(ws.Message{Event: event, Data: data}); err != nil {
		t.Fatalf("send %s: %v", event, err)
	}
}

// next returns the next message named event, discarding any others, or
// ok=false if none arrives within wait.
func (c *client) next(event string, wait time.Duration) (map[string]any, bool) {
	timeout := time.After(wait)
	for {
		select {
		case msg, open := <-c.events:
			if !open {
				return nil, false
			}
			if msg.Event != event {
				continue
			}
			data, _ := msg.Data.(map[string]any)
			return data, true
		case <-timeout:
			return nil, false
		}
	}
}

func (c *client) expect(t *testing.T, event string) map[string]any {
	t.Helper()
	data, ok := c.next(event, waitTimeout)
	if !ok {
		t.Fatalf("no %q event received", event)
	}
	return data
}

// startRepl serves handleWs over a workspace root in a temp dir and returns
// that root and a client whose handlers are all registered.
//
// handleWs is used directly, not NewHandler, so each test gets its own PTY
// manager instead of the package-level one.
func startRepl(t *testing.T) (string, *client) {
	t.Helper()

	root := t.TempDir()
	previous := workspaceRoot
	workspaceRoot = root
	t.Cleanup(func() { workspaceRoot = previous })

	sm := shutdown.NewShutdownManager("repl-test", nil)
	t.Cleanup(sm.Close)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handleWs(w, r, ws.NewWSHandler("repl-test", sm), pty.NewPTYManager())
	}))
	t.Cleanup(srv.Close)

	conn, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(srv.URL, "http"), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { conn.Close() })

	c := &client{conn: conn, events: make(chan ws.Message, 64)}
	go func() {
		defer close(c.events)
		for {
			var msg ws.Message
			if err := conn.ReadJSON(&msg); err != nil {
				return
			}
			c.events <- msg
		}
	}()

	waitForHandlers(t, c)
	return root, c
}

// waitForHandlers works around handleWs starting the read loop before it
// registers its handlers (a known bug): messages sent too early are dropped.
// "paste" is registered after every file tree handler, so once it answers,
// they all exist. With an empty clipboard paste only replies with an error.
func waitForHandlers(t *testing.T, c *client) {
	t.Helper()
	deadline := time.Now().Add(waitTimeout)
	for time.Now().Before(deadline) {
		c.send(t, "paste", PasteRequest{TargetPath: "unused"})
		if _, ok := c.next("pasteResponse", 50*time.Millisecond); ok {
			return
		}
	}
	t.Fatal("handlers were never registered")
}

func writeFile(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func TestFetchDirEvent(t *testing.T) {
	root, c := startRepl(t)
	writeFile(t, filepath.Join(root, "main.go"), "package main")
	writeFile(t, filepath.Join(root, "src", "util.go"), "package src")

	tests := []struct {
		dir  string
		want []string // "name/" for directories
	}{
		{"", []string{"main.go", "src/"}},
		{"src", []string{"util.go"}},
	}
	for _, tt := range tests {
		c.send(t, "fetchDir", FetchDirRequest{Dir: tt.dir})
		data := c.expect(t, "fetchDirResponse")

		if data["path"] != tt.dir {
			t.Errorf("fetchDir %q: path = %v, want %q", tt.dir, data["path"], tt.dir)
		}
		entries, _ := data["contents"].([]any)
		var got []string
		for _, e := range entries {
			entry, _ := e.(map[string]any)
			name, _ := entry["name"].(string)
			if entry["isDir"] == true {
				name += "/"
			}
			got = append(got, name)
		}
		sort.Strings(got)
		if strings.Join(got, ",") != strings.Join(tt.want, ",") {
			t.Errorf("fetchDir %q: contents = %v, want %v", tt.dir, got, tt.want)
		}
	}

	c.send(t, "fetchDir", FetchDirRequest{Dir: "missing"})
	if data := c.expect(t, "fetchDirResponse"); data["error"] == nil {
		t.Errorf("fetchDir of a missing dir: %v, want an error", data)
	}
}

func TestFetchContentEvent(t *testing.T) {
	root, c := startRepl(t)
	writeFile(t, filepath.Join(root, "src", "main.go"), "package main\n")

	c.send(t, "fetchContent", FetchContentRequest{Path: "src/main.go"})
	data := c.expect(t, "fetchContentResponse")
	if data["content"] != "package main\n" || data["path"] != "src/main.go" {
		t.Errorf("fetchContent = %v, want content %q and path %q", data, "package main\n", "src/main.go")
	}

	c.send(t, "fetchContent", FetchContentRequest{Path: "missing.go"})
	if data := c.expect(t, "fetchContentResponse"); data["error"] == nil {
		t.Errorf("fetchContent of a missing file: %v, want an error", data)
	}
}

func TestCreateFileEvent(t *testing.T) {
	root, c := startRepl(t)

	c.send(t, "createFile", CreateFileRequest{Path: "pkg/new/file.go"})
	data := c.expect(t, "createFileResponse")
	if data["success"] != true || data["path"] != "pkg/new/file.go" {
		t.Errorf("createFile = %v, want success and path %q", data, "pkg/new/file.go")
	}
	if _, err := os.Stat(filepath.Join(root, "pkg", "new", "file.go")); err != nil {
		t.Errorf("file not created in the workspace root: %v", err)
	}
}

func TestUpdateContentEvent(t *testing.T) {
	root, c := startRepl(t)
	path := filepath.Join(root, "notes.txt")
	writeFile(t, path, "hello world\n")

	dmp := diffmatchpatch.New()
	patch := dmp.PatchToText(dmp.PatchMake("hello world\n", "hello devex\n"))

	c.send(t, "updateContent", UpdateContentRequest{Path: "notes.txt", Patch: patch})
	if data := c.expect(t, "updateContentResponse"); data["success"] != true {
		t.Fatalf("updateContent = %v, want success", data)
	}
	if got, _ := os.ReadFile(path); string(got) != "hello devex\n" {
		t.Errorf("file content = %q, want %q", got, "hello devex\n")
	}

	c.send(t, "updateContent", UpdateContentRequest{Path: "notes.txt", Patch: "not a patch"})
	if data := c.expect(t, "updateContentResponse"); data["error"] == nil {
		t.Errorf("updateContent with a malformed patch: %v, want an error", data)
	}
	if got, _ := os.ReadFile(path); string(got) != "hello devex\n" {
		t.Errorf("file changed by a failed update: %q", got)
	}
}
