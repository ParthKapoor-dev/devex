package ws

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"runner/pkg/shutdown"

	"github.com/gorilla/websocket"
)

const waitTimeout = 5 * time.Second

// startServer serves a WSHandler, configured by register before Init, and
// returns a connected client. Registering before Init means no message from
// the client can arrive before its handler exists.
func startServer(t *testing.T, register func(h *WSHandler)) (*websocket.Conn, *shutdown.ShutdownManager) {
	t.Helper()

	sm := shutdown.NewShutdownManager("repl-test", nil)
	t.Cleanup(sm.Close)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := NewWSHandler("repl-test", sm)
		register(h)
		if err := h.Init(w, r); err != nil {
			t.Errorf("Init: %v", err)
		}
	}))
	t.Cleanup(srv.Close)

	conn, _, err := websocket.DefaultDialer.Dial("ws"+strings.TrimPrefix(srv.URL, "http"), nil)
	if err != nil {
		t.Fatalf("dial: %v", err)
	}
	t.Cleanup(func() { conn.Close() })
	return conn, sm
}

func receive[T any](t *testing.T, ch <-chan T, what string) T {
	t.Helper()
	select {
	case v := <-ch:
		return v
	case <-time.After(waitTimeout):
		t.Fatalf("timed out waiting for %s", what)
		var zero T
		return zero
	}
}

func TestEmitReplyRoundTrip(t *testing.T) {
	conn, _ := startServer(t, func(h *WSHandler) {
		h.On("ping", func(data any) {
			h.Emit("pong", map[string]any{"echo": data})
		})
	})

	if err := conn.WriteJSON(Message{Event: "ping", Data: "hello"}); err != nil {
		t.Fatal(err)
	}

	conn.SetReadDeadline(time.Now().Add(waitTimeout))
	var msg Message
	if err := conn.ReadJSON(&msg); err != nil {
		t.Fatalf("ReadJSON: %v", err)
	}
	if msg.Event != "pong" {
		t.Fatalf("event = %q, want %q", msg.Event, "pong")
	}
	data, ok := msg.Data.(map[string]any)
	if !ok || data["echo"] != "hello" {
		t.Errorf("data = %#v, want map with echo=hello", msg.Data)
	}
}

func TestHandlerReceivesDecodedData(t *testing.T) {
	got := make(chan any, 1)
	conn, _ := startServer(t, func(h *WSHandler) {
		h.On("fetchDir", func(data any) { got <- data })
	})

	if err := conn.WriteMessage(websocket.TextMessage, []byte(`{"event":"fetchDir","data":{"Dir":"src","depth":2}}`)); err != nil {
		t.Fatal(err)
	}

	data, ok := receive(t, got, "fetchDir handler").(map[string]any)
	if !ok || data["Dir"] != "src" || data["depth"] != float64(2) {
		t.Errorf("handler data = %#v, want map[Dir:src depth:2]", data)
	}
}

func TestUnknownEventKeepsConnectionUsable(t *testing.T) {
	got := make(chan struct{}, 1)
	conn, _ := startServer(t, func(h *WSHandler) {
		h.On("known", func(any) { got <- struct{}{} })
	})

	if err := conn.WriteJSON(Message{Event: "unknown"}); err != nil {
		t.Fatal(err)
	}
	if err := conn.WriteJSON(Message{Event: "known"}); err != nil {
		t.Fatal(err)
	}
	receive(t, got, "known handler after an unknown event")
}

func TestConnectDisconnectLifecycle(t *testing.T) {
	connected := make(chan struct{}, 1)
	disconnected := make(chan struct{}, 1)
	conn, sm := startServer(t, func(h *WSHandler) {
		h.On("connect", func(any) { connected <- struct{}{} })
		h.On("disconnect", func(any) { disconnected <- struct{}{} })
	})

	receive(t, connected, "connect event")
	if !sm.HasActiveConnection() {
		t.Error("shutdown manager not told about the connection")
	}

	conn.Close()
	receive(t, disconnected, "disconnect event")

	deadline := time.Now().Add(waitTimeout)
	for sm.HasActiveConnection() {
		if time.Now().After(deadline) {
			t.Fatal("shutdown manager not told the connection closed")
		}
		time.Sleep(time.Millisecond)
	}
}

func TestShutdownClosesConnection(t *testing.T) {
	ready := make(chan struct{}, 1)
	conn, sm := startServer(t, func(h *WSHandler) {
		h.On("connect", func(any) { ready <- struct{}{} })
	})
	receive(t, ready, "connect event")

	sm.Close()

	// The write loop exits on shutdown and closes the socket, so the
	// client's next read fails instead of blocking.
	conn.SetReadDeadline(time.Now().Add(waitTimeout))
	if _, _, err := conn.ReadMessage(); err == nil {
		t.Fatal("read succeeded after shutdown, want closed connection")
	} else if ne, ok := err.(interface{ Timeout() bool }); ok && ne.Timeout() {
		t.Fatal("connection still open after shutdown")
	}
}
