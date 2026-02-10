package ws

import (
	"fmt"
	log "packages/logging"
	"net/http"
	"sync"

	"runner/pkg/shutdown"

	"github.com/gorilla/websocket"
)

// Message represents the structured message format for WebSocket communication
type Message struct {
	Event string `json:"event"`
	Data  any    `json:"data,omitempty"`
}

// EventHandler represents a function that handles WebSocket events
type EventHandler func(data any)

// WSHandler handles WebSocket connections with Socket.IO-like functionality
type WSHandler struct {
	conn            *websocket.Conn
	upgrader        websocket.Upgrader
	handlers        map[string]EventHandler
	mu              sync.RWMutex // multiple readers, single writer
	writeChan       chan Message
	done            chan struct{}
	shutdownManager *shutdown.ShutdownManager
	replId          string
}

// NewWSHandler creates a new WSHandler instance
func NewWSHandler(replId string, shutdownManager *shutdown.ShutdownManager) *WSHandler {
	return &WSHandler{
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				// Allow connections from any origin (configure as needed for security)
				return true
			},
		},
		handlers:        make(map[string]EventHandler),
		writeChan:       make(chan Message, 256),
		done:            make(chan struct{}),
		shutdownManager: shutdownManager,
		replId:          replId,
	}
}

// Init initializes the WebSocket connection
func (ws *WSHandler) Init(w http.ResponseWriter, r *http.Request) error {
	conn, err := ws.upgrader.Upgrade(w, r, nil)
	if err != nil {
		return fmt.Errorf("failed to upgrade connection: %w", err)
	}

	ws.conn = conn

	// Notify shutdown manager about connection establishment
	if ws.shutdownManager != nil {
		ws.shutdownManager.OnConnectionEstablished()
	}

	// Start goroutines for reading and writing
	go ws.writeLoop()
	go ws.readLoop()

	// Emit connect event
	ws.triggerEvent("connect", nil)

	log.Info("WebSocket connection established", "repl_id", ws.replId)
	return nil
}

// On registers an event handler for a specific event type
func (ws *WSHandler) On(event string, handler EventHandler) {
	ws.mu.Lock()
	defer ws.mu.Unlock()
	ws.handlers[event] = handler
}

// Emit sends a message to the WebSocket client
func (ws *WSHandler) Emit(event string, data any) error {
	message := Message{
		Event: event,
		Data:  data,
	}

	select {
	case ws.writeChan <- message:
		return nil
	case <-ws.done:
		return fmt.Errorf("connection closed")
	case <-ws.shutdownManager.Context().Done():
		return fmt.Errorf("repl shutting down")
	default:
		return fmt.Errorf("write channel full")
	}
}

// readLoop continuously reads messages from the WebSocket connection
func (ws *WSHandler) readLoop() {
	defer func() {
		ws.triggerEvent("disconnect", nil)
		ws.Close()
	}()

	for {
		select {
		case <-ws.done:
			return
		case <-ws.shutdownManager.Context().Done():
			log.Warn("Repl is shutting down, closing WebSocket connection", "repl_id", ws.replId)
			return
		default:
			var message Message
			if err := ws.conn.ReadJSON(&message); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Warn("WebSocket error", "repl_id", ws.replId, "error", err)
				}
				return
			}

			// Trigger the appropriate event handler
			ws.triggerEvent(message.Event, message.Data)
		}
	}
}

// writeLoop continuously writes messages to the WebSocket connection
func (ws *WSHandler) writeLoop() {
	defer func() {
		ws.conn.Close()
		// Notify shutdown manager about connection closure
		if ws.shutdownManager != nil {
			ws.shutdownManager.OnConnectionClosed()
		}
		log.Info("WebSocket connection closed", "repl_id", ws.replId)
	}()

	for {
		select {
		case <-ws.done:
			return
		case <-ws.shutdownManager.Context().Done():
			log.Warn("Repl is shutting down, closing write loop", "repl_id", ws.replId)
			return
		case message := <-ws.writeChan:
			if err := ws.conn.WriteJSON(message); err != nil {
				log.Error("WebSocket write failed", "repl_id", ws.replId, "error", err)
				return
			}
		}
	}
}

// triggerEvent triggers the registered event handler for a specific event
func (ws *WSHandler) triggerEvent(event string, data any) {
	ws.mu.RLock()
	handler, exists := ws.handlers[event]
	ws.mu.RUnlock()

	if exists {
		// Run handler in a separate goroutine to avoid blocking
		go handler(data)
	} else {
		log.Warn("No handler registered for event", "event", event, "repl_id", ws.replId)
	}
}

// Close closes the WebSocket connection and cleanup resources
func (ws *WSHandler) Close() error {
	select {
	case <-ws.done:
		return nil // Already closed
	default:
		close(ws.done)
	}

	if ws.conn != nil {
		return ws.conn.Close()
	}
	return nil
}

// IsConnected returns true if the WebSocket connection is active
func (ws *WSHandler) IsConnected() bool {
	return ws.conn != nil
}

// Broadcast can be used to send messages to multiple connections (if you extend this)
// For now, it's the same as Emit but can be extended for multiple connections
func (ws *WSHandler) Broadcast(event string, data any) error {
	return ws.Emit(event, data)
}
