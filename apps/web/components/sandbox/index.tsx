import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
  RefObject,
} from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  Search,
  Maximize2,
  Minimize2,
  PanelLeftOpen,
  PanelLeftClose,
  Play,
  TerminalIcon,
  X,
  Menu,
  ChevronUp,
  ChevronDown,
  Settings,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import Editor from "./Editor";
import FileTree, { FileTreeAction, Tree } from "./FileTree";
import Output from "./Output";
import Terminal, { TerminalRef } from "./Terminal";
import { FileFinder } from "../commandMenu/finder";
import ShortcutKeysPopup from "./help";
import { cn } from "@/lib/utils";

interface SandboxProps {
  editor: {
    updateContent: (patch: string) => Promise<void>;
    code: string;
    setCode: Dispatch<SetStateAction<string>>;
    fileType: string;
  };

  fileTree: {
    tree: Tree;
    fetchDir: (path: string) => Promise<void>;
    fetchContent: (path: string) => Promise<void>;
    filePath: string;
    handleFileTreeAction: (action: FileTreeAction) => void;
  };
  terminal: {
    ref: RefObject<TerminalRef | null>;
    handleRequest: () => void;
    handleClose: () => void;
    handleError: (error: string) => void;
    handleResize: (cols: number, rows: number) => void;
    handleReady: () => void;
    handleSendData: (data: string) => void;
    sessionId: string | null;
    status: "connected" | "connecting" | "disconnected";
    error: string | null;
  };
  replId: string;
  isConnected: boolean;
}

/**
 * True when the event target is somewhere the user is entering text.
 *
 * Covers xterm's textarea and Monaco's hidden input as well as ordinary
 * fields — both are real focusable inputs in the DOM.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

const Sandbox: React.FC<SandboxProps> = ({
  editor,
  fileTree,
  terminal,
  replId,
  isConnected,
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [activeBottomPanel, setActiveBottomPanel] = useState<
    "terminal" | "output" | null
  >("terminal");

  // Responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bottomPanelCollapsed, setBottomPanelCollapsed] = useState(false);

  // Terminal-specific state
  const [isTerminalMaximized, setIsTerminalMaximized] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // refs
  const sidebarRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Responsive detection
  useEffect(() => {
    const checkResponsive = () => {
      const width = window.innerWidth;
      const newIsMobile = width < 768;
      const newIsTablet = width >= 768 && width < 1024;

      setIsMobile(newIsMobile);
      setIsTablet(newIsTablet);

      // Auto-collapse sidebar on mobile
      if (newIsMobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }

      // Auto-collapse bottom panel on very small screens
      if (width < 640 && !bottomPanelCollapsed) {
        setBottomPanelCollapsed(true);
      }
    };

    checkResponsive();
    window.addEventListener("resize", checkResponsive);
    return () => window.removeEventListener("resize", checkResponsive);
  }, []);

  // Terminal utility functions
  const focusTerminal = useCallback(() => {
    terminal.ref.current?.focus();
  }, []);

  const clearTerminal = useCallback(() => {
    terminal.ref.current?.clear();
  }, []);

  const resetTerminal = useCallback(() => {
    terminal.handleClose();
    terminal.ref.current?.reset();
    terminal.handleRequest();
  }, [terminal.handleRequest]);

  const reconnectTerminal = useCallback(() => {
    terminal.ref.current?.reconnect();
  }, []);

  const [terminalSearchTerm, setTerminalSearchTerm] = useState("");
  const searchInTerminal = useCallback((term: string) => {
    if (term && terminal.ref.current) {
      return terminal.ref.current.search(term);
    }
    return false;
  }, []);

  // keyboard shortcuts handler
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const { ctrlKey, shiftKey, key, metaKey } = event;
      const isCtrlOrCmd = ctrlKey || metaKey;

      // Disable some shortcuts on mobile
      if (isMobile) return;

      // Never steal a keystroke from something the user is typing into.
      // Without this, typing `?` in Monaco, in the rename box, or in the
      // terminal opened the shortcuts modal — the bare-key shortcuts below
      // have no modifier to tell them apart from ordinary text.
      if (isTypingTarget(event.target)) return;

      // Ctrl+Shift+E: Focus sidebar (Explorer)
      if (isCtrlOrCmd && shiftKey && key.toLowerCase() === "e") {
        event.preventDefault();
        if (sidebarCollapsed) {
          setSidebarCollapsed(false);
        }
        sidebarRef.current?.focus();
        return;
      }

      // Ctrl+Shift+P: Open Settings
      if (isCtrlOrCmd && shiftKey && key.toLowerCase() === "p") {
        event.preventDefault();
        setShowSettings(true);
        return;
      }

      // Shift+/: Open Shortcuts
      if (key.toLowerCase() === "?") {
        event.preventDefault();
        setShowHelp(true);
        return;
      }

      // Ctrl+B: Toggle sidebar
      if (isCtrlOrCmd && !shiftKey && key.toLowerCase() === "b") {
        event.preventDefault();
        setSidebarCollapsed((prev) => !prev);
        return;
      }

      // Ctrl+`: Toggle terminal
      if (isCtrlOrCmd && key === "`") {
        event.preventDefault();
        if (bottomPanelCollapsed || activeBottomPanel !== "terminal") {
          setActiveBottomPanel("terminal");
          setTimeout(() => focusTerminal(), 100);
        } else {
          setActiveBottomPanel(null);
        }
        return;
      }

      // Ctrl+Shift+Y: Toggle output
      if (isCtrlOrCmd && shiftKey && key.toLowerCase() === "y") {
        event.preventDefault();

        setBottomPanelCollapsed((prev) => !prev);
        if (bottomPanelCollapsed || activeBottomPanel !== "output") {
          setActiveBottomPanel("output");
          setBottomPanelCollapsed(false);
        }
        return;
      }

      // Ctrl+Shift+C: Clear terminal
      if (
        isCtrlOrCmd &&
        shiftKey &&
        key.toLowerCase() === "c" &&
        activeBottomPanel === "terminal"
      ) {
        event.preventDefault();
        clearTerminal();
        return;
      }

      // Ctrl+Shift+R: Reset terminal
      if (
        isCtrlOrCmd &&
        shiftKey &&
        key.toLowerCase() === "r" &&
        activeBottomPanel === "terminal"
      ) {
        event.preventDefault();
        resetTerminal();
        return;
      }

      // Ctrl+Shift+F: Search in terminal
      if (
        isCtrlOrCmd &&
        shiftKey &&
        key.toLowerCase() === "f" &&
        activeBottomPanel === "terminal"
      ) {
        event.preventDefault();
        const term = prompt("Search in terminal:");
        if (term) {
          searchInTerminal(term);
        }
        return;
      }

      // Ctrl+1: Focus editor
      if (isCtrlOrCmd && key === "1") {
        event.preventDefault();
        editorRef.current?.focus();
        return;
      }

      // Ctrl+2: Focus terminal
      if (isCtrlOrCmd && key === "2") {
        event.preventDefault();
        if (activeBottomPanel != "terminal") {
          setActiveBottomPanel("terminal");
          setBottomPanelCollapsed(false);
        }
        setTimeout(() => focusTerminal(), 100);
        return;
      }

      // Escape: Focus editor from anywhere
      if (key === "Escape") {
        editorRef.current?.focus();
        return;
      }
    },
    [
      isMobile,
      sidebarCollapsed,
      // Read by the Ctrl+` branch below. Omitting it pinned the handler to
      // whatever the panel state was when it was first registered.
      bottomPanelCollapsed,
      activeBottomPanel,
      clearTerminal,
      resetTerminal,
      searchInTerminal,
      focusTerminal,
    ],
  );

  // Register keyboard shortcuts
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Calculate if bottom panel should be shown
  const showBottomPanel = !bottomPanelCollapsed;

  const scrollTerminalToBottom = useCallback(() => {
    terminal.ref.current?.scrollToBottom();
  }, []);

  // Auto-scroll terminal to bottom when new data arrives
  useEffect(() => {
    if (activeBottomPanel === "terminal") {
      const timer = setTimeout(() => {
        scrollTerminalToBottom();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeBottomPanel, scrollTerminalToBottom]);

  // Responsive sidebar handler
  const handleSidebarToggle = () => {
    console.log(sidebarCollapsed);
    setSidebarCollapsed((prev) => !prev);
  };

  // Mobile bottom panel handler
  const handleBottomPanelToggle = () => {
    setBottomPanelCollapsed((prev) => !prev);
    if (!bottomPanelCollapsed && isMobile) {
      // On mobile, maximize bottom panel when opening
      setIsTerminalMaximized(true);
    }
  };

  const [activePath, setActivePath] = useState<string | null>(null);

  function handleFetchFile(path: string) {
    setActivePath(path);
    fileTree.fetchContent(path);
  }

  function handleFetchDir(path: string) {
    if (!fileTree.tree[path]) {
      fileTree.fetchDir(path);
    }
  }

  return (
    <div className="h-screen w-full  bg-gradient-to-br from-gray-900 via-black to-gray-900  flex flex-col pt-14">
      {/* Mobile header */}
      {isMobile && (
        <div className="h-12 bg-gray-900 border-b border-gray-600 flex items-center justify-between px-3 relative z-50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8 p-0 text-gray-300 hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="text-white text-sm font-medium truncate">
              {fileTree.filePath || "Sandbox"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <FileFinder
              tree={fileTree.tree}
              handleFile={handleFetchFile}
              handleDir={handleFetchDir}
            />

            <Button
              variant="ghost"
              onClick={() =>
                fileTree.filePath == ""
                  ? toast("Open/Create a file to continue")
                  : setShowSettings(true)
              }
              className=" items-center gap-1 rounded border border-border bg-muted px-2 text-lg font-mono font-medium opacity-100 ml-auto flex"
              title="Settings"
              size={"sm"}
            >
              <Settings className="h-2 w-2" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBottomPanelToggle}
              className="h-8 px-2 text-xs text-gray-300 hover:text-white"
            >
              <TerminalIcon className="h-3 w-3" />
            </Button>
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <div
                className={`w-2 h-2 rounded-full ${
                  terminal.status === "connected"
                    ? "bg-green-500"
                    : terminal.status === "connecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
            </div>
          </div>

          {/* Mobile menu overlay */}
          {mobileMenuOpen && (
            <div className="absolute top-12 left-0 right-0 bg-gray-900 border-b border-gray-600 p-3 shadow-lg">
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSidebarCollapsed(false);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-gray-300 hover:text-white"
                >
                  <PanelLeftOpen className="h-4 w-4 mr-2" />
                  Toggle Explorer
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBottomPanel("terminal");
                    setBottomPanelCollapsed(false);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-gray-300 hover:text-white"
                >
                  <TerminalIcon className="h-4 w-4 mr-2" />
                  Terminal
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setActiveBottomPanel("output");
                    setBottomPanelCollapsed(false);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-gray-300 hover:text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Output
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop top bar */}
      {!isMobile && (
        <div className="h-10  bg-gradient-to-br from-gray-900 via-black to-emerald-900 border-b border-gray-600 flex items-center px-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSidebarToggle}
            className="h-6 w-6 p-0 text-gray-300 hover:text-white"
            title={`${sidebarCollapsed ? "Show" : "Hide"} Sidebar (Ctrl+B)`}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>

          {/* Connection status indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
              title={`Socket: ${isConnected ? "Connected" : "Disconnected"}`}
            />
            <div
              className={`w-2 h-2 rounded-full ${
                terminal.status === "connected"
                  ? "bg-green-500"
                  : terminal.status === "connecting"
                    ? "bg-yellow-500"
                    : "bg-red-500"
              }`}
              title={`Terminal: ${terminal.status}`}
            />

            <Button variant="ghost" onClick={() => setShowHelp(true)}>
              <kbd className=" transition-colors duration-150 hover:bg-emerald-800 select-none items-center gap-1 rounded border hover:border-emerald-950 border-border bg-muted px-2 text-sm font-mono font-medium opacity-100 ml-auto flex">
                Shft + /
              </kbd>
            </Button>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <FileFinder
              tree={fileTree.tree}
              handleFile={handleFetchFile}
              handleDir={handleFetchDir}
            />

            <Button
              variant="ghost"
              onClick={() =>
                fileTree.filePath == ""
                  ? toast("Open/Create a file to continue")
                  : setShowSettings(true)
              }
              className=" transition-colors duration-150 hover:bg-emerald-800 items-center gap-1 rounded border border-border bg-muted px-2 text-lg font-mono font-medium opacity-100 ml-auto flex"
              title="Settings"
              size={"sm"}
            >
              <Settings className="h-2 w-2" />
            </Button>

            <Button
              variant={activeBottomPanel === "terminal" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                if (activeBottomPanel === "terminal") {
                  setActiveBottomPanel(null);
                } else {
                  setActiveBottomPanel("terminal");
                  setBottomPanelCollapsed(false);
                  setTimeout(() => focusTerminal(), 100);
                }
              }}
              className="items-center gap-1 rounded border border-border bg-muted px-2 text-xs font-mono font-medium opacity-100 ml-auto flex transition-colors duration-150 hover:bg-emerald-800"
              title="Toggle Terminal (Ctrl+`)"
            >
              <TerminalIcon className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Terminal</span>
              {terminal.error && (
                <span className="ml-1 text-red-400 text-xs">!</span>
              )}
            </Button>

            <Button
              variant={activeBottomPanel === "output" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                if (activeBottomPanel === "output") {
                  setActiveBottomPanel(null);
                } else {
                  setActiveBottomPanel("output");
                  setBottomPanelCollapsed(false);
                }
              }}
              className=" items-center gap-1 rounded border border-border bg-muted px-2 text-xs font-mono font-medium opacity-100 ml-auto flex transition-colors duration-150 hover:bg-emerald-800"
              title="Toggle Output (Ctrl+Shift+Y)"
            >
              <Play className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">Output</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile layout */}
        {isMobile ? (
          <div className="flex-1 flex flex-col">
            {/* Mobile sidebar overlay */}
            {!sidebarCollapsed && (
              <div
                className="fixed inset-0 z-40 bg-black bg-opacity-50"
                onClick={() => setSidebarCollapsed(true)}
              >
                <div
                  className="absolute left-0 top-0 bottom-0 w-full bg-gray-900 border-r border-gray-600"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-full">
                    <div className="h-12 bg-gray-800 border-b border-gray-600 flex items-center justify-between px-3">
                      <span className="text-white text-sm font-medium">
                        Explorer
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarCollapsed(true)}
                        className="h-6 w-6 p-0 text-gray-300 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="h-full pt-12">
                      <FileTree
                        tree={fileTree.tree}
                        fetchDir={fileTree.fetchDir}
                        fetchContent={fileTree.fetchContent}
                        onAction={fileTree.handleFileTreeAction}
                        activePath={activePath}
                        setActivePath={setActivePath}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile editor */}
            <div
              className={`flex-1 ${!bottomPanelCollapsed && showBottomPanel ? "h-1/2" : "h-full"}`}
            >
              <div ref={editorRef} className="h-full">
                {fileTree.filePath == "" ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                      <FileText className="w-12 h-12 text-emerald-400" />
                      <p className="text-emerald-400 font-medium font-mono">
                        Select/Create a File to Continue
                      </p>
                      <p className="text-gray-500 text-sm">
                        Open a file from the sidebar on the left
                      </p>
                    </div>
                  </div>
                ) : (
                  <Editor
                    sendDiff={editor.updateContent}
                    code={editor.code}
                    setCode={editor.setCode}
                    fileType={editor.fileType}
                    showSettings={showSettings}
                    setShowSettings={setShowSettings}
                  />
                )}
              </div>
            </div>

            {/* Mobile bottom panel */}
            {!bottomPanelCollapsed && showBottomPanel && (
              <div className="h-1/2 border-t border-gray-700 flex flex-col">
                <div className="h-10 bg-gray-800 border-b flex items-center justify-between px-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActiveBottomPanel("terminal");
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeBottomPanel === "terminal"
                          ? "bg-white text-gray-900"
                          : "text-gray-600 hover:text-gray-100"
                      }`}
                    >
                      Terminal
                    </button>
                    <button
                      onClick={() => {
                        setActiveBottomPanel("output");
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        activeBottomPanel === "output"
                          ? "bg-white text-gray-900"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Output
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Terminal-specific controls */}
                    {activeBottomPanel === "terminal" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearTerminal}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Clear Terminal"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetTerminal}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Reset Terminal"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const term = prompt("Search in terminal:");
                            if (term) searchInTerminal(term);
                          }}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                          title="Search in Terminal"
                        >
                          <Search className="h-3 w-3" />
                        </Button>
                      </>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsTerminalMaximized(!isTerminalMaximized)
                      }
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title={isTerminalMaximized ? "Restore" : "Maximize"}
                    >
                      {isTerminalMaximized ? (
                        <Minimize2 className="h-3 w-3" />
                      ) : (
                        <Maximize2 className="h-3 w-3" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleBottomPanelToggle}
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                      title="Close Panel"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Panel content */}
                <div className="flex-1 overflow-hidden">
                  <div
                    className={
                      activeBottomPanel === "terminal" ? "h-full" : "hidden"
                    }
                  >
                    <Terminal
                      ref={terminal.ref}
                      onSendData={terminal.handleSendData}
                      sessionId={terminal.sessionId}
                      onRequestTerminal={terminal.handleRequest}
                      onTerminalResize={terminal.handleResize}
                      onReady={terminal.handleReady}
                      onClose={terminal.handleClose}
                      onError={terminal.handleError}
                      className="h-full"
                    />
                  </div>
                  <div
                    className={
                      activeBottomPanel === "output" ? "h-full" : "hidden"
                    }
                  >
                    <Output
                      replId={replId}
                      isVisible={true}
                      className="h-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Desktop layout
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Sidebar Panel */}
            {!sidebarCollapsed && (
              <>
                <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                  <div ref={sidebarRef} className="h-full">
                    <FileTree
                      tree={fileTree.tree}
                      fetchDir={fileTree.fetchDir}
                      fetchContent={fileTree.fetchContent}
                      onAction={fileTree.handleFileTreeAction}
                      activePath={activePath}
                      setActivePath={setActivePath}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle />
              </>
            )}

            {/* Main content area (Editor + Bottom panel) */}
            <ResizablePanel defaultSize={sidebarCollapsed ? 100 : 80}>
              <ResizablePanelGroup direction="vertical" className="h-full">
                {/* Code Editor */}
                <ResizablePanel
                  defaultSize={showBottomPanel ? 70 : 100}
                  minSize={30}
                >
                  <div ref={editorRef} className="h-full">
                    {fileTree.filePath == "" ? (
                      <div className="w-full h-full bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <FileText className="w-12 h-12 text-emerald-400" />
                          <p className="text-emerald-400 font-medium font-mono">
                            Select/Create a File to Continue
                          </p>
                          <p className="text-gray-500 text-sm">
                            Open a file from the sidebar on the left
                          </p>
                        </div>
                      </div>
                    ) : (
                      <Editor
                        sendDiff={editor.updateContent}
                        code={editor.code}
                        setCode={editor.setCode}
                        fileType={editor.fileType}
                        showSettings={showSettings}
                        setShowSettings={setShowSettings}
                      />
                    )}
                  </div>
                </ResizablePanel>

                {/* Bottom Panel (Terminal/Output) */}
                {showBottomPanel && (
                  <>
                    <ResizableHandle />
                    <ResizablePanel
                      defaultSize={30}
                      minSize={15}
                      className={cn(activeBottomPanel == null && "hidden")}
                    >
                      <div className="h-full bg-zinc-900 border-t border-gray-800">
                        {/* Tab buttons for bottom panel */}
                        <div className="h-8 bg-gradient-to-br from-gray-900 via-black/80 to-emerald-900 border-b border-gray-800 flex items-center justify-between px-2">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                setActiveBottomPanel("terminal");
                                setTimeout(() => focusTerminal(), 100);
                              }}
                              className={`px-3 py-1 text-xs rounded-t border-b-2 transition-colors ${
                                activeBottomPanel === "terminal"
                                  ? "bg-white border-blue-500 text-gray-900"
                                  : "bg-gray-100 border-transparent text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <TerminalIcon className="h-3 w-3 mr-1 inline" />
                              Terminal
                              {terminal.error && (
                                <span className="ml-1 text-red-500 text-xs">
                                  !
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setActiveBottomPanel("output");
                              }}
                              className={`px-3 py-1 text-xs rounded-t border-b-2 transition-colors ${
                                activeBottomPanel === "output"
                                  ? "bg-white border-blue-500 text-gray-900"
                                  : "bg-gray-100 border-transparent text-gray-600 hover:text-gray-900"
                              }`}
                            >
                              <Play className="h-3 w-3 mr-1 inline" />
                              Output
                            </button>
                          </div>

                          {/* Terminal-specific controls */}
                          {activeBottomPanel === "terminal" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearTerminal}
                                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                title="Clear Terminal"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetTerminal}
                                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                title="Reset Terminal"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const term = prompt("Search in terminal:");
                                  if (term) searchInTerminal(term);
                                }}
                                className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                                title="Search in Terminal (Ctrl+Shift+F)"
                              >
                                <Search className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setIsTerminalMaximized(!isTerminalMaximized)
                              }
                              className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                              title={
                                isTerminalMaximized ? "Restore" : "Maximize"
                              }
                            >
                              {isTerminalMaximized ? (
                                <Minimize2 className="h-3 w-3" />
                              ) : (
                                <Maximize2 className="h-3 w-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (activeBottomPanel === "terminal") {
                                  setActiveBottomPanel(null);
                                } else {
                                  setActiveBottomPanel(null);
                                }
                              }}
                              className="h-5 w-5 p-0 text-gray-500 hover:text-gray-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Panel content */}
                        <div
                          className="h-full overflow-hidden"
                          style={{ height: "calc(100% - 2rem)" }}
                        >
                          <div
                            className={
                              activeBottomPanel === "terminal"
                                ? "h-full"
                                : "hidden"
                            }
                          >
                            <Terminal
                              ref={terminal.ref}
                              onSendData={terminal.handleSendData}
                              onRequestTerminal={terminal.handleRequest}
                              onTerminalResize={terminal.handleResize}
                              onReady={terminal.handleReady}
                              onClose={terminal.handleClose}
                              sessionId={terminal.sessionId}
                              onError={terminal.handleError}
                              className="h-full"
                            />
                          </div>

                          <div
                            className={
                              activeBottomPanel === "output"
                                ? "h-full"
                                : "hidden"
                            }
                          >
                            <Output
                              replId={replId}
                              isVisible={true}
                              className="h-full"
                            />
                          </div>
                        </div>
                      </div>
                    </ResizablePanel>
                  </>
                )}
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      {showHelp && <ShortcutKeysPopup onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default Sandbox;
