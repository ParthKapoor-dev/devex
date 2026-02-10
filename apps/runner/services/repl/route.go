package repl

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	log "packages/logging"
	"net/http"
	"path/filepath"
	"strings"
	"sync"

	"runner/pkg/fs"
	"runner/pkg/pty"
	"runner/pkg/shutdown"
	"runner/pkg/ws"
)

var (
	ptyManager *pty.PTYManager
	once       sync.Once
)

// Existing request structures (assumed)
func getPTYManager() *pty.PTYManager {
	once.Do(func() {
		ptyManager = pty.NewPTYManager()
	})
	return ptyManager
}

func NewHandler(sm *shutdown.ShutdownManager) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		wsHandler := ws.NewWSHandler(strings.Split(r.Host, ".")[0], sm)
		ptyManager = getPTYManager()
		defer ptyManager.Cleanup()
		handleWs(w, r, wsHandler, ptyManager)
	})
	return mux
}

func generateSessionID() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		return ""
	}
	return hex.EncodeToString(bytes)
}

func handleWs(w http.ResponseWriter, r *http.Request, ws *ws.WSHandler, ptyManager *pty.PTYManager) {
	if err := ws.Init(w, r); err != nil {
		log.Error("WebSocket init failed", "host", r.Host, "error", err)
		return
	}

	ws.On("Connection", func(data any) {
		rootContents, err := fs.FetchDir("/workspaces", "")
		if err != nil {
			ws.Emit("error", map[string]any{"message": "Failed to load directory"})
			return
		}
		ws.Emit("Loaded", map[string]any{
			"rootContents": rootContents,
		})
	})

	// File Tree Actions
	OnTyped(ws, "fetchDir", func(req FetchDirRequest) {
		contents, err := fs.FetchDir("/workspaces", req.Dir)
		if err != nil {
			log.Error("Fetch directory failed", "path", req.Dir, "error", err)
			ws.Emit("fetchDirResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("fetchDirResponse", map[string]any{"contents": contents, "path": req.Dir})
	})

	OnTyped(ws, "fetchContent", func(req FetchContentRequest) {
		fullPath := fmt.Sprintf("/workspaces/%s", req.Path)
		data, err := fs.FetchFileContent(fullPath)
		if err != nil {
			log.Error("Fetch file content failed", "path", req.Path, "full_path", fullPath, "error", err)
			ws.Emit("fetchContentResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("fetchContentResponse", map[string]string{"content": data, "path": req.Path})
	})

	OnTyped(ws, "updateContent", func(req UpdateContentRequest) {
		fullPath := fmt.Sprintf("/workspaces/%s", req.Path)
		err := fs.SaveFileDiffs(fullPath, req.Patch)
		if err != nil {
			log.Error("Save file failed", "path", req.Path, "full_path", fullPath, "error", err)
			ws.Emit("updateContentResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("updateContentResponse", map[string]any{"success": true})
	})

	OnTyped(ws, "createFile", func(req CreateFileRequest) {
		fullPath := filepath.Join("/workspaces", req.Path)
		err := fs.CreateFile(fullPath)
		if err != nil {
			log.Error("Create file failed", "path", req.Path, "full_path", fullPath, "error", err)
			ws.Emit("createFileResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("createFileResponse", map[string]any{"success": true, "path": req.Path})
	})

	OnTyped(ws, "createFolder", func(req CreateFolderRequest) {
		fullPath := filepath.Join("/workspaces", req.Path)
		err := fs.CreateFolder(fullPath)
		if err != nil {
			log.Error("Create folder failed", "path", req.Path, "full_path", fullPath, "error", err)
			ws.Emit("createFolderResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("createFolderResponse", map[string]any{"success": true, "path": req.Path})
	})

	OnTyped(ws, "delete", func(req DeleteRequest) {
		fullPath := filepath.Join("/workspaces", req.Path)
		err := fs.Delete(fullPath)
		if err != nil {
			log.Error("Delete failed", "path", req.Path, "full_path", fullPath, "error", err)
			ws.Emit("deleteResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("deleteResponse", map[string]any{"success": true, "path": req.Path})
	})

	OnTyped(ws, "rename", func(req RenameRequest) {
		oldFullPath := filepath.Join("/workspaces", req.OldPath)
		newFullPath := filepath.Join("/workspaces", req.NewPath)
		err := fs.Rename(oldFullPath, newFullPath)
		if err != nil {
			log.Error("Rename failed", "old_path", req.OldPath, "new_path", req.NewPath, "error", err)
			ws.Emit("renameResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("renameResponse", map[string]any{
			"success": true,
			"oldPath": req.OldPath,
			"newPath": req.NewPath,
		})
	})

	OnTyped(ws, "copy", func(req CopyRequest) {
		sourceFullPath := filepath.Join("/workspaces", req.SourcePath)
		targetFullPath := filepath.Join("/workspaces", req.TargetPath)
		err := fs.Copy(sourceFullPath, targetFullPath)
		if err != nil {
			log.Error("Copy failed", "source_path", req.SourcePath, "target_path", req.TargetPath, "error", err)
			ws.Emit("copyResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("copyResponse", map[string]any{
			"success":    true,
			"sourcePath": req.SourcePath,
			"targetPath": req.TargetPath,
		})
	})

	OnTyped(ws, "cut", func(req CutRequest) {
		sourceFullPath := filepath.Join("/workspaces", req.SourcePath)
		err := fs.Cut(sourceFullPath)
		if err != nil {
			log.Error("Cut failed", "source_path", req.SourcePath, "error", err)
			ws.Emit("cutResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("cutResponse", map[string]any{
			"success":    true,
			"sourcePath": req.SourcePath,
		})
	})

	OnTyped(ws, "paste", func(req PasteRequest) {
		targetFullPath := filepath.Join("/workspaces", req.TargetPath)
		err := fs.Paste(targetFullPath)
		if err != nil {
			log.Error("Paste failed", "target_path", req.TargetPath, "error", err)
			ws.Emit("pasteResponse", map[string]any{"error": err.Error()})
			return
		}
		ws.Emit("pasteResponse", map[string]any{
			"success":    true,
			"targetPath": req.TargetPath,
		})
	})

	// Terminal Actions
	ws.On("requestTerminal", func(data any) {
		sessionID := generateSessionID()
		if sessionID == "" {
			ws.Emit("terminalError", map[string]string{"error": "Failed to generate session ID"})
			return
		}

		session, err := ptyManager.CreateSession(sessionID, nil)
		if err != nil {
			ws.Emit("terminalError", map[string]string{"error": "Failed to create terminal session"})
			return
		}

		ws.Emit("terminalConnected", map[string]string{"sessionId": sessionID})

		session.SetOnDataCallback(func(data []byte) {
			ws.Emit("terminalResponse", string(data))
		})

		session.SetOnCloseCallback(func() {
			ws.Emit("terminalClosed", nil)
			ptyManager.RemoveSession(sessionID)
		})
	})

	OnTyped(ws, "closeTerminal", func(req TerminalCloseRequest) {
		session, exists := ptyManager.GetSession(req.SessionID)
		if !exists {
			return
		}
		session.Close()
	})

	OnTyped(ws, "terminalInput", func(req TerminalDataRequest) {
		session, exists := ptyManager.GetSession(req.SessionID)
		if !exists {
			return
		}
		session.WriteString(req.Data)
	})

	OnTyped(ws, "terminalResize", func(req TerminalResizeRequest) {
		session, exists := ptyManager.GetSession(req.SessionID)
		if !exists {
			return
		}
		session.Resize(req.Cols, req.Rows)
	})
}
