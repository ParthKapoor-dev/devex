"use client";

// hooks
import { useRunnerSocket } from "@/hooks/useSocket";

// React
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

// Components
import Sandbox from "@/components/sandbox/index";
import { Button } from "@/components/ui/button";
import { FileTreeAction, Tree } from "@/components/sandbox/FileTree";
import { toast } from "sonner";
import { TerminalRef } from "@/components/sandbox/Terminal";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";

export default function ReplPage() {
  const { slug } = useParams();

  // sockets states
  const { isConnected, emit, on, off } = useRunnerSocket(slug as string);

  // sandbox states
  const [tree, setTree] = useState<Tree | null>(null);
  const [code, setCode] = useState<string>(
    `// Welcome to Devex: your Cloud IDE Editor`,
  );
  const [fileType, setFileType] = useState<string>("js");
  const [filePath, setFilePath] = useState<string>("");

  const terminalRef = useRef<TerminalRef>(null);
  const terminalSessionIdRef = useRef<string | null>(null);
  const [terminalConnectionStatus, setTerminalConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [terminalError, setTerminalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) return;
    console.log("Use Effect call");

    emit("Connection");

    // Connection and loading handlers
    on("Loaded", (data) => {
      console.log("Received Loaded Data", data);
      setTree({
        "": data.rootContents,
      });
    });

    on("error", (data) => {
      console.error("WebSocket error:", data);
      toast.error(data.message || "An error occurred");
    });

    // File tree response handlers
    on("fetchDirResponse", (data) => {
      console.log("📁 Dir contents:", data);
      if (data.error) {
        toast.error(`Failed to load directory: ${data.error}`);
      } else {
        setTree((prev) => ({ ...prev, [data.path]: data.contents }));
      }
    });

    on("fetchContentResponse", (data) => {
      console.log("📄 File contents:", data);
      if (data.error) {
        toast.error(`Failed to load file: ${data.error}`);
      } else {
        setCode(data.content);
        setFilePath(data.path);
        setFileType(data.path.split(".").pop()?.toLowerCase() || "txt");
      }
    });

    on("updateContentResponse", (data) => {
      console.log("💾 File update response:", data);
      if (data.error) {
        toast.error(`Failed to save file: ${data.error}`);
      } else {
        // toast.success("File saved successfully");
      }
    });

    // File operation response handlers
    on("createFileResponse", (data) => {
      console.log("📄 Create file response:", data);
      if (data.error) {
        toast.error(`Failed to create file: ${data.error}`);
      } else {
        toast.success(`File created: ${data.path}`);
        // Refresh the parent directory
        const parentPath = data.path.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("createFolderResponse", (data) => {
      console.log("📁 Create folder response:", data);
      if (data.error) {
        toast.error(`Failed to create folder: ${data.error}`);
      } else {
        toast.success(`Folder created: ${data.path}`);
        // Refresh the parent directory
        const parentPath = data.path.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("deleteResponse", (data) => {
      console.log("🗑️ Delete response:", data);
      if (data.error) {
        toast.error(`Failed to delete: ${data.error}`);
      } else {
        toast.success(`Deleted: ${data.path}`);
        // Refresh the parent directory
        const parentPath = data.path.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("renameResponse", (data) => {
      console.log("✏️ Rename response:", data);
      if (data.error) {
        toast.error(`Failed to rename: ${data.error}`);
      } else {
        toast.success(`Renamed: ${data.oldPath} → ${data.newPath}`);
        // Refresh the parent directory
        const parentPath = data.newPath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: parentPath });
      }
    });

    on("copyResponse", (data) => {
      console.log("📋 Copy response:", data);
      if (data.error) {
        toast.error(`Failed to copy: ${data.error}`);
      } else {
        toast.success(`Copied: ${data.sourcePath} → ${data.targetPath}`);
        // Refresh the target directory
        const targetDir = data.targetPath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: targetDir });
      }
    });

    on("cutResponse", (data) => {
      console.log("✂️ Cut response:", data);
      if (data.error) {
        toast.error(`Failed to cut: ${data.error}`);
      } else {
        toast.success(`Cut: ${data.sourcePath}`);
        // Refresh the source directory
        const sourceDir = data.sourcePath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: sourceDir });
      }
    });

    on("pasteResponse", (data) => {
      console.log("📋 Paste response:", data);
      if (data.error) {
        toast.error(`Failed to paste: ${data.error}`);
      } else {
        toast.success(`Pasted to: ${data.targetPath}`);
        // Refresh the target directory
        const targetDir = data.targetPath.split("/").slice(0, -1).join("/");
        emit("fetchDir", { Dir: targetDir });
      }
    });

    // Terminal response handlers
    on("terminalResponse", (data) => {
      if (terminalRef.current?.isReady()) {
        terminalRef.current.writeData(data);
      }
      console.log("🖥️ Terminal output:", data);
    });

    on("terminalConnected", (data) => {
      terminalSessionIdRef.current = data.sessionId || "";
      setTerminalConnectionStatus("connected");
      setTerminalError(null);
      terminalRef.current?.writeData(
        "\r\n\x1b[32m✓ Terminal connected successfully\x1b[0m\r\n",
      );
      console.log("🖥️ Terminal Connected:", data);
    });

    on("terminalClosed", (data) => {
      setTerminalConnectionStatus("disconnected");
      terminalRef.current?.writeData(
        "\r\n\x1b[31m✗ Terminal session closed\x1b[0m\r\n",
      );
      toast.info("Terminal session closed");
      console.log("🖥️ Terminal Closed:", data);
    });

    on("terminalError", (data) => {
      setTerminalError(data.error || "Unknown terminal error");
      setTerminalConnectionStatus("disconnected");
      terminalRef.current?.writeData(
        `\r\n\x1b[31m✗ Terminal error: ${data.error}\x1b[0m\r\n`,
      );
      toast.error(`Terminal error: ${data.error}`);
      console.error("🖥️ Terminal Error:", data);
    });

    return () => {
      off("Loaded");
      off("error");
      off("fetchDirResponse");
      off("fetchContentResponse");
      off("updateContentResponse");
      off("createFileResponse");
      off("createFolderResponse");
      off("deleteResponse");
      off("renameResponse");
      off("copyResponse");
      off("cutResponse");
      off("pasteResponse");
      off("terminalResponse");
      off("terminalConnected");
      off("terminalClosed");
      off("terminalError");
    };
  }, [isConnected]);

  // Editor Helpers
  const fetchDir = useCallback(
    async (path: string) => {
      emit("fetchDir", { Dir: path });
    },
    [emit],
  );

  const fetchContent = useCallback(
    async (path: string) => {
      emit("fetchContent", { path });
    },
    [emit],
  );

  // `filePath` is read through a ref rather than listed as a dependency, so
  // opening a different file does not hand the editor a brand new `sendDiff`
  // and remount its debounce.
  const filePathRef = useRef(filePath);
  useEffect(() => {
    filePathRef.current = filePath;
  }, [filePath]);

  const updateContent = useCallback(
    async (patch: string) => {
      emit("updateContent", { path: filePathRef.current, patch });
    },
    [emit],
  );

  const handleFileTreeAction = useCallback(
    (action: FileTreeAction) => {
    switch (action.type) {
      case "create-file":
        emit("createFile", {
          path: `${action.path}/${action.newName}`,
        });
        break;

      case "create-folder":
        emit("createFolder", {
          path: `${action.path}/${action.newName}`,
        });
        break;

      case "rename":
        emit("rename", {
          oldPath: action.path,
          newPath: `${action.path.split("/").slice(0, -1).join("/")}/${action.newName}`,
        });
        break;

      case "delete":
        emit("delete", {
          path: action.path,
        });
        break;

      case "copy":
        emit("copy", {
          sourcePath: action.path,
          targetPath: action.targetPath,
        });
        break;

      case "cut":
        emit("cut", {
          sourcePath: action.path,
        });
        break;

      case "paste":
        emit("paste", {
          targetPath: action.targetPath,
        });
        break;

      default:
        console.warn(`Unknown action type: ${action.type}`);
        break;
    }
    },
    [emit],
  );

  // Enhanced Terminal Helpers.
  //
  // `terminalSessionIdRef.current` used to appear in these dependency arrays.
  // A ref's `.current` in a dependency list does nothing useful — React
  // compares it on render, but mutating a ref does not schedule one, so the
  // callback never rebuilds when the session id actually changes. It is read
  // at call time instead, which is both correct and stable.
  const handleTerminalSendData = useCallback(
    (data: string) => {
      emit("terminalInput", {
        data,
        sessionId: terminalSessionIdRef.current,
      });
    },
    [emit],
  );

  const handleRequestTerminal = useCallback(() => {
    setTerminalConnectionStatus("connecting");
    setTerminalError(null);
    emit("requestTerminal", { sessionId: terminalSessionIdRef.current });
  }, [emit]);

  const handleTerminalResize = useCallback(
    (cols: number, rows: number) => {
      emit("terminalResize", {
        cols,
        rows,
        sessionId: terminalSessionIdRef.current,
      });
    },
    [emit],
  );

  // Enhanced terminal event handlers
  const handleTerminalReady = useCallback(() => {
    setTerminalConnectionStatus("connected");
    setTerminalError(null);
    console.log("🖥️ Terminal ready");
  }, []);

  const handleTerminalClose = useCallback(() => {
    emit("closeTerminal", {
      sessionId: terminalSessionIdRef.current,
    });
    setTerminalConnectionStatus("disconnected");
    console.log("🖥️ Terminal closed by user");
  }, [emit]);

  const handleTerminalError = useCallback((error: string) => {
    setTerminalError(error);
    setTerminalConnectionStatus("disconnected");
    console.error("🖥️ Terminal error:", error);
  }, []);

  // The three prop objects are memoised because they are object literals:
  // rebuilt on every render they are a new reference every time, which makes
  // `React.memo` on anything below this point a no-op. `terminal` is the one
  // that matters — a fresh object there re-renders the xterm wrapper.
  const editorProps = useMemo(
    () => ({ updateContent, code, setCode, fileType }),
    [updateContent, code, fileType],
  );

  // Returns null until the tree has loaded, so the `!tree` guard below
  // narrows this too — cleaner than asserting non-null past the guard.
  const fileTreeProps = useMemo(
    () =>
      tree
        ? { tree, fetchDir, fetchContent, handleFileTreeAction, filePath }
        : null,
    [tree, fetchDir, fetchContent, handleFileTreeAction, filePath],
  );

  const terminalProps = useMemo(
    () => ({
      ref: terminalRef,
      handleRequest: handleRequestTerminal,
      handleClose: handleTerminalClose,
      handleError: handleTerminalError,
      handleResize: handleTerminalResize,
      handleReady: handleTerminalReady,
      handleSendData: handleTerminalSendData,
      sessionId: terminalSessionIdRef.current,
      status: terminalConnectionStatus,
      error: terminalError,
    }),
    [
      handleRequestTerminal,
      handleTerminalClose,
      handleTerminalError,
      handleTerminalResize,
      handleTerminalReady,
      handleTerminalSendData,
      terminalConnectionStatus,
      terminalError,
    ],
  );

  if (!tree || !fileTreeProps) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-term-bg">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="label text-ink-muted">Loading workspace</p>
          <p className="font-mono text-xs text-ink-subtle">
            {isConnected ? "reading filesystem" : "connecting to runner"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Sandbox
        isConnected={isConnected}
        editor={editorProps}
        fileTree={fileTreeProps}
        terminal={terminalProps}
        replId={slug as string}
      />
    </ProtectedRoute>
  );
}
