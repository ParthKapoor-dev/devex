package repl

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"runner/pkg/shutdown"
	"runner/pkg/ws"

	"github.com/gorilla/websocket"
)

func TestOnTyped(t *testing.T) {
	sm := shutdown.NewShutdownManager("repl-test", nil)
	t.Cleanup(sm.Close)

	got := make(chan TerminalResizeRequest, 8)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := ws.NewWSHandler("repl-test", sm)
		// Registered before Init, so no message can beat the handler.
		OnTyped(h, "terminalResize", func(req TerminalResizeRequest) { got <- req })
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

	wait := func() TerminalResizeRequest {
		t.Helper()
		select {
		case req := <-got:
			return req
		case <-time.After(waitTimeout):
			t.Fatal("typed handler was not called")
			return TerminalResizeRequest{}
		}
	}
	send := func(raw string) {
		t.Helper()
		if err := conn.WriteMessage(websocket.TextMessage, []byte(raw)); err != nil {
			t.Fatal(err)
		}
	}

	t.Run("decodes payload", func(t *testing.T) {
		send(`{"event":"terminalResize","data":{"cols":120,"rows":40,"sessionId":"abc"}}`)
		want := TerminalResizeRequest{Cols: 120, Rows: 40, SessionID: "abc"}
		if req := wait(); req != want {
			t.Errorf("handler got %+v, want %+v", req, want)
		}
	})

	t.Run("missing data decodes to zero value", func(t *testing.T) {
		send(`{"event":"terminalResize"}`)
		if req := wait(); req != (TerminalResizeRequest{}) {
			t.Errorf("handler got %+v, want zero value", req)
		}
	})

	t.Run("ignores undecodable payloads", func(t *testing.T) {
		send(`{"event":"terminalResize","data":{"cols":"wide","rows":40,"sessionId":"bad"}}`)
		send(`{"event":"terminalResize","data":"not an object"}`)
		send(`{"event":"terminalResize","data":{"cols":1,"rows":2,"sessionId":"good"}}`)

		if req := wait(); req.SessionID != "good" {
			t.Fatalf("handler got %+v, want only the decodable payload", req)
		}
		// Handlers run in their own goroutines, so give a wrongly delivered
		// payload a moment to show up before asserting nothing else came.
		select {
		case req := <-got:
			t.Errorf("handler called with undecodable payload, got %+v", req)
		case <-time.After(50 * time.Millisecond):
		}
	})
}
