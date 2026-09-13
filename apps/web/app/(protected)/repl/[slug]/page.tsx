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
import {
  isSameOrInside,
  joinPath,
  parentOf,
  rebasePath,
} from "@/components/sandbox/FileTree/paths";
import { toast } from "sonner";
import { TerminalRef } from "@/components/sandbox/Terminal";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { CoreService } from "@/lib/core";

const WELCOME = `// Welcome to Devex: your Cloud IDE Editor`;

/** Every folder from the root down to `path`'s parent: `a/b/c` → "", a, a/b. */
function ancestorsOf(path: string) {
  const dirs = [""];
  let cursor = "";
  for (const segment of parentOf(path).split("/").filter(Boolean)) {
    cursor = joinPath(cursor, segment);
    dirs.push(cursor);
  }
  return dirs;
}

/** The tree without `path` and anything cached beneath it. */
function pruneTree(tree: Tree | null, path: string): Tree | null {
  if (!tree) return tree;
  const next: Tree = {};
  for (const key of Object.keys(tree)) {
    if (key === "" || !isSameOrInside(key, path)) next[key] = tree[key];
  }
  return next;
}

export default function ReplPage() {
  const { slug } = useParams();

  // sockets states
  const { isConnected, emit, on, off } = useRunnerSocket(slug as string);

  /**
   * The workspace's name, for the title bar.
   *
   * The route slug is the REPL's id — `repl-f34552ed-d4f9-…` — which is what
   * the IDE was showing you all day. The core API has no single-REPL endpoint,
   * so this reads the list once on mount and picks out the matching row. It is
   * a read, it happens alongside the socket handshake, and the id stays as the
   * fallback if the lookup fails, so nothing here can leave the header blank.
   */
  const [replName, setReplName] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let ignore = false;

    (async () => {
      try {
        const repls = await CoreService.getInstance().getRepls();
        const match = repls.find((repl) => repl.id === slug);
        if (!ignore && match) setReplName(match.name);
      } catch {
        // The header falls back to the id. Not worth a toast — the socket
        // connection is the thing that actually matters on this page, and it
        // reports its own failures.
      }
    })();

    return () => {
      ignore = true;
    };
  }, [slug]);

  // sandbox states
  const [tree, setTree] = useState<Tree | null>(null);
  const [code, setCode] = useState<string>(WELCOME);
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
        // `?? []` because an empty directory arrives as `null`, not `[]`.
        //
        // The runner builds the listing with `var result []DirEntry` and
        // appends in a loop; for an empty directory the loop never runs, the
        // slice stays nil, and Go marshals a nil slice as JSON `null`. So
        // creating a folder and opening it put `null` into the tree, and the
        // file finder's `entries.forEach` threw on the next render — taking
        // the whole page down.
        //
        // Normalised here, at the one place directory listings enter the app,
        // so nothing downstream has to know. It also stops the tree
        // re-fetching an empty folder on every expand: the old value was
        // falsy, so `if (!tree[path])` was true forever.
        setTree((prev) => ({ ...prev, [data.path]: data.contents ?? [] }));
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

    // File operation response handlers.
    //
    // Successes are quiet: the tree changing in front of you is the
    // confirmation, and a toast for every new file buried the ones that
    // mattered. Failures still toast, with the runner's reason.
    const refreshDirs = (dirs: string[]) => {
      for (const dir of new Set(dirs)) emit("fetchDir", { Dir: dir });
    };

    on("createFileResponse", (data) => {
      if (data.error) {
        toast.error(`Couldn't create the file: ${data.error}`);
        return;
      }
      // Every folder on the way: `src/lib/a.ts` may have created `src/lib`.
      refreshDirs(ancestorsOf(data.path));
      // Open what you just made, as every editor does.
      emit("fetchContent", { path: data.path });
    });

    on("createFolderResponse", (data) => {
      if (data.error) {
        toast.error(`Couldn't create the folder: ${data.error}`);
        return;
      }
      refreshDirs([...ancestorsOf(data.path), data.path]);
    });

    on("deleteResponse", (data) => {
      if (data.error) {
        toast.error(`Couldn't delete ${data.path ?? "that"}: ${data.error}`);
        return;
      }
      setTree((prev) => pruneTree(prev, data.path));
      refreshDirs([parentOf(data.path)]);
      // Deleting the open file (or a folder holding it) left the editor
      // pointed at a path that no longer existed, and the next save failed.
      if (filePathRef.current && isSameOrInside(filePathRef.current, data.path)) {
        setFilePath("");
        setCode(WELCOME);
      }
    });

    // Rename and move are the same runner event.
    on("renameResponse", (data) => {
      if (data.error) {
        toast.error(`Couldn't move or rename: ${data.error}`);
        return;
      }
      setTree((prev) => pruneTree(prev, data.oldPath));
      // Both folders: a move used to refresh only the destination, so the
      // item stayed listed where it came from until a manual refresh.
      refreshDirs([parentOf(data.oldPath), parentOf(data.newPath)]);
      // Keep the editor on the file it has open, under its new path.
      // Otherwise every later save was sent to the old path and failed.
      const open = filePathRef.current;
      if (open && isSameOrInside(open, data.oldPath)) {
        const moved = rebasePath(open, data.oldPath, data.newPath);
        setFilePath(moved);
        setFileType(moved.split(".").pop()?.toLowerCase() || "txt");
      }
    });

    on("copyResponse", (data) => {
      if (data.error) {
        toast.error(`Couldn't copy: ${data.error}`);
        return;
      }
      refreshDirs([parentOf(data.targetPath)]);
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
          emit("createFile", { path: joinPath(action.path, action.newName) });
          break;

        case "create-folder":
          emit("createFolder", { path: joinPath(action.path, action.newName) });
          break;

        case "rename":
          emit("rename", {
            oldPath: action.path,
            newPath: joinPath(parentOf(action.path), action.newName),
          });
          break;

        case "move":
          emit("rename", { oldPath: action.path, newPath: action.targetPath });
          break;

        case "copy":
          emit("copy", {
            sourcePath: action.path,
            targetPath: action.targetPath,
          });
          break;

        case "delete":
          emit("delete", { path: action.path });
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
  /**
   * Whether the buffer has edits the runner has not seen yet.
   *
   * The editor coalesces keystrokes and pushes a diff on an idle window, so
   * there is a real window where the screen is ahead of the container. The
   * editor reports only the *edges* of that state, so this holds two renders
   * per typing burst rather than one per character — and `editorProps` is
   * memoised without it, so Monaco does not re-render for either.
   */
  const [isDirty, setIsDirty] = useState(false);
  const handleDirtyChange = useCallback(
    (dirty: boolean) => setIsDirty(dirty),
    [],
  );

  const editorProps = useMemo(
    () => ({
      updateContent,
      code,
      setCode,
      fileType,
      isDirty,
      onDirtyChange: handleDirtyChange,
    }),
    [updateContent, code, fileType, isDirty, handleDirtyChange],
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
      <div className="flex h-dvh w-full items-center justify-center bg-term-bg">
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
        replName={replName}
      />
    </ProtectedRoute>
  );
}
