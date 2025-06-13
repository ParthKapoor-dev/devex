package repl

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/parthkapoor-dev/runner/pkg/fs"
	"github.com/parthkapoor-dev/runner/pkg/pty"
	"github.com/parthkapoor-dev/runner/pkg/ws"
)

func NewHandler() http.Handler {
	mux := http.NewServeMux()
	ws := ws.NewWSHandler()

	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handleWs(w, r, ws)
	})
	return mux
}

func handleWs(w http.ResponseWriter, r *http.Request, ws *ws.WSHandler) {

	if err := ws.Init(w, r); err != nil {
		log.Fatal(err)
	}

	host := r.Host
	replId := strings.Split(host, ".")[0]
	if replId == "" {
		log.Println("No repl ID found, closing connection")
		return
	}

	ws.On("Connection", func(data any) {
		rootContents, _ := fs.FetchDir("/workspaces", "")
		ws.Emit("Loaded", map[string]any{
			"rootContents": rootContents,
		})
	})

	OnTyped(ws, "fetchDir", func(req FetchDirRequest) {

		dirPath := fmt.Sprintf("/workspace/%s", req.Dir)
		contents, err := fs.FetchDir(dirPath, req.Dir)
		if err != nil {
			log.Printf("Error fetching directory: %v", err)
			ws.Emit("fetchDirResponse", map[string]any{
				"error": err.Error(),
			})
			return
		}

		// Send response back to client
		ws.Emit("fetchDirResponse", contents)
	})

	// Handle fetchContent event
	OnTyped(ws, "fetchContent", func(req FetchContentRequest) {
		fullPath := fmt.Sprintf("/workspace/%s", req.Path)
		data, err := fs.FetchFileContent(fullPath)
		if err != nil {
			log.Printf("Error fetching file content: %v", err)
			ws.Emit("fetchContentResponse", map[string]any{
				"error": err.Error(),
			})
			return
		}

		// Send response back to client
		ws.Emit("fetchContentResponse", data)
	})

	// Handle updateContent event
	OnTyped(ws, "updateContent", func(req UpdateContentRequest) {
		fullPath := fmt.Sprintf("/workspace/%s", req.Path)

		// Save file locally
		err := fs.SaveFile(fullPath, req.Content)
		if err != nil {
			log.Printf("Error saving file: %v", err)
			ws.Emit("updateContentResponse", map[string]any{
				"error": err.Error(),
			})
			return
		}

		ws.Emit("updateContentResponse", map[string]any{
			"success": true,
		})
	})

	// Handle requestTerminal event
	ws.On("requestTerminal", func(data any) {
		pty.StartTerminal(replId)
	})

	// Handle terminalData event
	OnTyped(ws, "terminalData", func(req TerminalDataRequest) {
		// TODO: pty.write
	})

}
