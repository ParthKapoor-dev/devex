import { useCallback, useEffect, useRef, useState } from "react";

export type Events = {
  Loaded: (data: { rootContents: any }) => void;
  fetchDirResponse: (data: any) => void;
  fetchContentResponse: (data: any) => void;
  updateContentResponse: (data: any) => void;
  terminalResponse: (data: any) => void;
  terminalClosed: (data: any) => void;
  terminalConnected: (data: any) => void;
  terminalError: (data: any) => void;
  copyResponse: (data: any) => void;
  renameResponse: (data: any) => void;
  deleteResponse: (data: any) => void;
  createFolderResponse: (data: any) => void;
  createFileResponse: (data: any) => void;
  cutResponse: (data: any) => void;
  pasteResponse: (data: any) => void;
  error: (data: any) => void;
};

type EventHandler = (...args: any[]) => void;

interface Socket extends WebSocket {
  emit?: (event: string, data?: any) => void;
  on?: (event: keyof Events, handler: EventHandler) => void;
  off?: (event: keyof Events) => void;
}

const RUNNER_DOMAIN_NAME =
  process.env.NEXT_PUBLIC_RUNNER_DOMAIN_NAME || "localhost:8000";

export function useRunnerSocket(replId: string) {
  const socketRef = useRef<Socket | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Record<string, EventHandler[]>>({});

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${process.env.NEXT_PUBLIC_RUNNER_DOMAIN_NAME}/${replId}/api/v1/repl/ws`;
    const testingUrl = "ws://localhost:8081/api/v1/repl/ws";

    const socket: Socket = new WebSocket(url);

    // Extend native WebSocket with .emit/.on/.off
    socket.emit = (event: string, data: any) => {
      socket.send(JSON.stringify({ event, data }));
    };

    socket.on = (event: keyof Events, handler: EventHandler) => {
      if (!listenersRef.current[event]) {
        listenersRef.current[event] = [];
      }
      listenersRef.current[event].push(handler);
    };

    socket.off = (event) => {
      delete listenersRef.current[event];
    };

    socket.addEventListener("open", () => {
      setIsConnected(true);
      console.log("✅ Connected to runner WebSocket");
    });

    socket.addEventListener("close", () => {
      setIsConnected(false);
      console.warn("⚠️ Disconnected from runner WebSocket");
    });

    socket.addEventListener("error", (err) => {
      console.error("❌ WebSocket error:", err);
    });

    socket.addEventListener("message", (msg) => {
      try {
        const parsed = JSON.parse(msg.data);
        const { event, data } = parsed;

        const handlers = listenersRef.current[event];
        if (handlers) {
          handlers.forEach((fn) => fn(data));
        }
      } catch (err) {
        console.error("❌ Failed to parse WebSocket message:", err);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
      listenersRef.current = {};
    };
  }, [replId]);

  // Proxy functions (typed).
  //
  // These are memoised with an empty dependency list, which is safe because
  // they only ever reach through `socketRef` — a ref, so they always see the
  // live socket without needing to be rebuilt when it changes.
  //
  // Referential stability matters more than it looks: every consumer lists
  // `emit` in a `useCallback` dependency array, so when these were rebuilt on
  // each render, *every* memoised handler downstream was rebuilt too. That
  // made the memoisation across the whole REPL page decorative.
  const emit = useCallback((event: string, payload?: any) => {
    socketRef.current?.emit?.(event, payload);
  }, []);

  const on = useCallback(
    <K extends keyof Events>(event: K, handler: Events[K]) => {
      socketRef.current?.on?.(event, handler as EventHandler);
    },
    [],
  );

  const off = useCallback((event: keyof Events) => {
    socketRef.current?.off?.(event);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
    off,
  };
}
