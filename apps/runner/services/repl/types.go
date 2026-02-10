package repl

import (
	"encoding/json"
	log "packages/logging"
	"runner/pkg/ws"
)

type FetchDirRequest struct {
	Dir string `json:"Dir"`
}

type FetchContentRequest struct {
	Path string `json:"path"`
}

type UpdateContentRequest struct {
	Path  string `json:"path"`
	Patch string `json:"patch"`
}

type CreateFolderRequest struct {
	Path string `json:"path"`
}

type DeleteRequest struct {
	Path string `json:"path"`
}

type RenameRequest struct {
	OldPath string `json:"oldPath"`
	NewPath string `json:"newPath"`
}

type CopyRequest struct {
	SourcePath string `json:"sourcePath"`
	TargetPath string `json:"targetPath"`
}

type CutRequest struct {
	SourcePath string `json:"sourcePath"`
}

type PasteRequest struct {
	TargetPath string `json:"targetPath"`
}

type CreateFileRequest struct {
	Path string `json:"path"`
	Name string `json:"name"`
}

type TerminalDataRequest struct {
	Data      string `json:"data"`
	SessionID string `json:"sessionId"`
}

type TerminalCloseRequest struct {
	SessionID string `json:"sessionId"`
}

type TerminalResizeRequest struct {
	Cols      int    `json:"cols"`
	Rows      int    `json:"rows"`
	SessionID string `json:"sessionId"`
}

// OnTyped registers a strongly-typed event handler
func OnTyped[T any](ws *ws.WSHandler, event string, handler func(T)) {
	ws.On(event, func(data any) {
		// Type assertion and conversion
		if jsonData, err := json.Marshal(data); err == nil {
			var typedData T
			if err := json.Unmarshal(jsonData, &typedData); err == nil {
				handler(typedData)
			} else {
				log.Warn("Failed to unmarshal event data", "event", event, "error", err)
			}
		}
	})
}
