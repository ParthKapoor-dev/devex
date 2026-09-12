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
import {
  CHROME,
  ChromeDivider,
  EmptyEditorState,
  IconButton,
  PanelTab,
  StatusBar,
  StatusItem,
} from "./chrome";

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
    <div className="flex h-screen w-full flex-col bg-term-bg pt-14">
      {/* Mobile header */}
      {isMobile && (
        <div className="relative z-50 flex h-10 items-center justify-between border-b border-edge bg-surface px-2">
          <div className="flex items-center gap-2">
            <IconButton
              label={mobileMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="size-4" />
            </IconButton>
            <span className="truncate font-mono text-xs text-ink-muted">
              {fileTree.filePath || "sandbox"}
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
              className="h-8 px-2 text-xs text-ink-muted hover:text-ink"
            >
              <TerminalIcon className="h-3 w-3" />
            </Button>
          </div>

          {/* Mobile menu overlay */}
          {mobileMenuOpen && (
            <div className="absolute inset-x-0 top-10 border-b border-edge bg-overlay p-2">
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSidebarCollapsed(false);
                    setMobileMenuOpen(false);
                  }}
                  className="justify-start text-ink-muted hover:text-ink"
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
                  className="justify-start text-ink-muted hover:text-ink"
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
                  className="justify-start text-ink-muted hover:text-ink"
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
        <div
          className={cn(
            CHROME.topBar,
            "flex shrink-0 items-center gap-1.5 border-b border-edge bg-surface px-2",
          )}
        >
          <IconButton
            label={`${sidebarCollapsed ? "Show" : "Hide"} explorer (Ctrl+B)`}
            onClick={handleSidebarToggle}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </IconButton>

          <ChromeDivider />

          <span className="truncate font-mono text-xs text-ink-subtle">
            {replId}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <FileFinder
              tree={fileTree.tree}
              handleFile={handleFetchFile}
              handleDir={handleFetchDir}
            />

            <IconButton
              label="Editor settings (Ctrl+Shift+P)"
              onClick={() =>
                fileTree.filePath == ""
                  ? toast("Open or create a file to continue")
                  : setShowSettings(true)
              }
            >
              <Settings className="size-4" />
            </IconButton>

            <IconButton
              label="Keyboard shortcuts (Shift+/)"
              onClick={() => setShowHelp(true)}
            >
              <span aria-hidden="true" className="font-mono text-sm">
                ?
              </span>
            </IconButton>

            <ChromeDivider />

            <IconButton
              label="Toggle terminal (Ctrl+`)"
              active={activeBottomPanel === "terminal"}
              onClick={() => {
                if (activeBottomPanel === "terminal") {
                  setActiveBottomPanel(null);
                } else {
                  setActiveBottomPanel("terminal");
                  setBottomPanelCollapsed(false);
                  setTimeout(() => focusTerminal(), 100);
                }
              }}
            >
              <TerminalIcon className="size-4" />
            </IconButton>

            <IconButton
              label="Toggle output (Ctrl+Shift+Y)"
              active={activeBottomPanel === "output"}
              onClick={() => {
                if (activeBottomPanel === "output") {
                  setActiveBottomPanel(null);
                } else {
                  setActiveBottomPanel("output");
                  setBottomPanelCollapsed(false);
                }
              }}
            >
              <Play className="size-4" />
            </IconButton>
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
                className="fixed inset-0 z-40 bg-canvas/60"
                onClick={() => setSidebarCollapsed(true)}
              >
                <div
                  className="absolute inset-y-0 left-0 w-full border-r border-edge bg-surface"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="h-full">
                    <div className="flex h-10 items-center justify-between border-b border-edge bg-raised px-3">
                      <span className="label text-ink-muted">Explorer</span>
                      <IconButton
                        label="Close explorer"
                        onClick={() => setSidebarCollapsed(true)}
                      >
                        <X className="size-4" />
                      </IconButton>
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
                  <EmptyEditorState
                    icon={<FileText className="size-8" />}
                    title="No file open"
                    hint="Pick a file from the explorer, or press Ctrl+P to search."
                  />
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
              <div className="flex h-1/2 flex-col border-t border-edge">
                <div className={cn(CHROME.panelTab, "flex shrink-0 items-center justify-between border-b border-edge bg-raised pr-2")}>
                  <div role="tablist" className="flex h-full">
                    <PanelTab
                      active={activeBottomPanel === "terminal"}
                      attention={Boolean(terminal.error)}
                      onClick={() => setActiveBottomPanel("terminal")}
                    >
                      Terminal
                    </PanelTab>
                    <PanelTab
                      active={activeBottomPanel === "output"}
                      onClick={() => setActiveBottomPanel("output")}
                    >
                      Output
                    </PanelTab>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Terminal-specific controls */}
                    {activeBottomPanel === "terminal" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearTerminal}
                          className="text-ink-subtle hover:text-ink"
                          title="Clear Terminal"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetTerminal}
                          className="text-ink-subtle hover:text-ink"
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
                          className="text-ink-subtle hover:text-ink"
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
                      className="text-ink-subtle hover:text-ink"
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
                      className="text-ink-subtle hover:text-ink"
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
                      <EmptyEditorState
                        icon={<FileText className="size-8" />}
                        title="No file open"
                        hint="Pick a file from the explorer, or press Ctrl+P to search."
                      />
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
                      <div className="h-full border-t border-edge bg-term-bg">
                        {/* Tab buttons for bottom panel */}
                        <div className={cn(CHROME.panelTab, "flex shrink-0 items-center justify-between border-b border-edge bg-raised pr-2")}>
                          <div role="tablist" className="flex h-full">
                            <PanelTab
                              active={activeBottomPanel === "terminal"}
                              attention={Boolean(terminal.error)}
                              onClick={() => {
                                setActiveBottomPanel("terminal");
                                setTimeout(() => focusTerminal(), 100);
                              }}
                            >
                              <TerminalIcon className="size-3" />
                              Terminal
                            </PanelTab>
                            <PanelTab
                              active={activeBottomPanel === "output"}
                              onClick={() => setActiveBottomPanel("output")}
                            >
                              <Play className="size-3" />
                              Output
                            </PanelTab>
                          </div>

                          {/* Terminal-specific controls */}
                          {activeBottomPanel === "terminal" && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearTerminal}
                                className="text-ink-subtle hover:text-ink"
                                title="Clear Terminal"
                              >
                                <RotateCcw className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={resetTerminal}
                                className="text-ink-subtle hover:text-ink"
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
                                className="text-ink-subtle hover:text-ink"
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
                              className="text-ink-subtle hover:text-ink"
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
                              className="text-ink-subtle hover:text-ink"
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

      <StatusBar>
        <StatusItem
          tone={isConnected ? "ok" : "off"}
          value={isConnected ? "connected" : "offline"}
          title={`Workspace socket: ${isConnected ? "connected" : "disconnected"}`}
        />
        <StatusItem
          tone={
            terminal.status === "connected"
              ? "ok"
              : terminal.status === "connecting"
                ? "busy"
                : "off"
          }
          label="term"
          value={terminal.status}
          title={terminal.error ?? `Terminal: ${terminal.status}`}
        />

        {fileTree.filePath && (
          <span className="min-w-0 flex-1 truncate text-ink-subtle">
            {fileTree.filePath}
          </span>
        )}

        <span className="ml-auto flex items-center gap-4">
          {fileTree.filePath && (
            <StatusItem value={editor.fileType || "txt"} />
          )}
          <button
            type="button"
            onClick={() => setShowHelp(true)}
            className="text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            shift+/ for shortcuts
          </button>
        </span>
      </StatusBar>

      {showHelp && <ShortcutKeysPopup onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default Sandbox;
