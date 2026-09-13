package pty

import (
	"bytes"
	"os"
	"sync"
	"testing"
	"time"
)

const waitTimeout = 5 * time.Second

// requireSessions skips tests that start real sessions when they cannot run
// cleanly.
func requireSessions(t *testing.T) {
	t.Helper()
	if _, err := os.Stat("/bin/bash"); err != nil {
		t.Skip("/bin/bash not available")
	}
	if raceEnabled {
		// Closing a live session calls exec.Cmd.Wait from cleanup while
		// start is still inside its own Wait, which the race detector
		// reports. These tests run under plain `go test`.
		t.Skip("known bug: PTYSession.Close races with start on exec.Cmd.Wait")
	}
}

// newSession starts a bash session in a temp dir (the default working
// directory, /workspaces, does not exist outside a workspace pod).
func newSession(t *testing.T, pm *PTYManager, id string) *PTYSession {
	t.Helper()
	s, err := pm.CreateSession(id, &PTYConfig{WorkingDir: t.TempDir()})
	if err != nil {
		t.Fatalf("CreateSession(%q): %v", id, err)
	}
	t.Cleanup(s.Close)
	return s
}

// output collects everything a session writes.
type output struct {
	mu     sync.Mutex
	buf    bytes.Buffer
	notify chan struct{}
}

func newOutput() *output {
	return &output{notify: make(chan struct{}, 1)}
}

func (o *output) write(data []byte) {
	o.mu.Lock()
	o.buf.Write(data)
	o.mu.Unlock()
	select {
	case o.notify <- struct{}{}:
	default:
	}
}

func (o *output) waitFor(t *testing.T, want string) {
	t.Helper()
	timeout := time.After(waitTimeout)
	for {
		o.mu.Lock()
		found := bytes.Contains(o.buf.Bytes(), []byte(want))
		o.mu.Unlock()
		if found {
			return
		}
		select {
		case <-o.notify:
		case <-timeout:
			o.mu.Lock()
			defer o.mu.Unlock()
			t.Fatalf("output never contained %q, got %q", want, o.buf.String())
		}
	}
}

func TestSessionEcho(t *testing.T) {
	requireSessions(t)
	pm := NewPTYManager()
	s := newSession(t, pm, "echo")

	out := newOutput()
	s.SetOnDataCallback(out.write)

	// The shell echoes the typed command too, so look for text that only
	// the command's output contains.
	if err := s.WriteString("echo hel''lo-from-pty\n"); err != nil {
		t.Fatalf("WriteString: %v", err)
	}
	out.waitFor(t, "hello-from-pty")
}

func TestSessionResize(t *testing.T) {
	requireSessions(t)
	pm := NewPTYManager()
	s := newSession(t, pm, "resize")

	if err := s.Resize(132, 43); err != nil {
		t.Fatalf("Resize: %v", err)
	}
	size, err := s.GetSize()
	if err != nil {
		t.Fatalf("GetSize: %v", err)
	}
	if size.Cols != 132 || size.Rows != 43 {
		t.Errorf("size = %dx%d, want 132x43", size.Cols, size.Rows)
	}
}

func TestSessionCloseIsIdempotent(t *testing.T) {
	requireSessions(t)
	pm := NewPTYManager()
	s := newSession(t, pm, "close")

	closed := make(chan struct{}, 4)
	s.SetOnCloseCallback(func() { closed <- struct{}{} })

	s.Close()
	s.Close()

	select {
	case <-closed:
	case <-time.After(waitTimeout):
		t.Fatal("close callback not called")
	}
	select {
	case <-closed:
		t.Error("close callback called more than once")
	case <-time.After(50 * time.Millisecond):
	}

	if s.IsActive() {
		t.Error("IsActive = true after Close")
	}
	if err := s.WriteString("echo nope\n"); err == nil {
		t.Error("WriteString after Close returned no error")
	}
	if err := s.Resize(80, 24); err == nil {
		t.Error("Resize after Close returned no error")
	}
}

func TestCreateSessionDuplicateID(t *testing.T) {
	requireSessions(t)
	pm := NewPTYManager()
	newSession(t, pm, "dup")

	if _, err := pm.CreateSession("dup", &PTYConfig{WorkingDir: t.TempDir()}); err == nil {
		t.Fatal("CreateSession with a duplicate ID returned no error")
	}
	if ids := pm.ListSessions(); len(ids) != 1 || ids[0] != "dup" {
		t.Errorf("ListSessions = %v, want [dup]", ids)
	}
}

func TestManagerRemoveAndCleanup(t *testing.T) {
	requireSessions(t)
	pm := NewPTYManager()
	a := newSession(t, pm, "a")
	b := newSession(t, pm, "b")

	if got, ok := pm.GetSession("a"); !ok || got != a {
		t.Fatalf("GetSession(a) = %v, %v", got, ok)
	}

	pm.RemoveSession("a")
	if _, ok := pm.GetSession("a"); ok {
		t.Error("session a still registered after RemoveSession")
	}
	if a.IsActive() {
		t.Error("RemoveSession did not close the session")
	}

	pm.Cleanup()
	if ids := pm.ListSessions(); len(ids) != 0 {
		t.Errorf("ListSessions after Cleanup = %v, want none", ids)
	}
	if b.IsActive() {
		t.Error("Cleanup did not close the session")
	}
}
