/**
 * @fileoverview Terminal Component - A React wrapper for xterm.js terminal emulator
 *
 * This component provides a fully-featured terminal interface that can be embedded
 * in React applications. It uses xterm.js under the hood, which is a terminal emulator
 * written in TypeScript that works in browsers and Node.js.
 *
 * Key Features:
 * - Full terminal emulation with ANSI color support
 * - Customizable themes and fonts
 * - Search functionality
 * - Copy/paste support
 * - Automatic resizing
 * - Session management
 * - Error handling with retry capability
 *
 * @version 1.0.0
 * @author Parth Kapoor
 * @since 2025
 */

"use client";

import React, {
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import "@xterm/xterm/css/xterm.css"; // Required CSS for xterm.js styling
import { token } from "@/lib/tokens";
import { mono } from "@/app/fonts";

/**
 * Props interface for the Terminal component
 *
 * This interface defines all the configuration options and event handlers
 * that can be passed to the Terminal component.
 */
interface TerminalProps {
  /**
   * Callback fired when user types or sends data to the terminal
   * @param data - The data that was typed or pasted by the user
   */
  onSendData?: (data: string) => void;

  /**
   * Callback fired when the terminal needs to establish a connection
   * This is typically used to connect to a backend terminal session
   */
  onRequestTerminal?: () => void;

  /**
   * Callback fired when the terminal is resized
   * @param cols - Number of columns in the terminal
   * @param rows - Number of rows in the terminal
   */
  onTerminalResize?: (cols: number, rows: number) => void;

  /**
   * Terminal color theme configuration
   * All colors should be in hex format (e.g., "#ffffff")
   */
  theme?: {
    background?: string; // Background color of the terminal
    foreground?: string; // Default text color
    cursor?: string; // Cursor color
    selection?: string; // Selection highlight color
    black?: string; // ANSI black color
    red?: string; // ANSI red color
    green?: string; // ANSI green color
    yellow?: string; // ANSI yellow color
    blue?: string; // ANSI blue color
    magenta?: string; // ANSI magenta color
    cyan?: string; // ANSI cyan color
    white?: string; // ANSI white color
    brightBlack?: string; // ANSI bright black color
    brightRed?: string; // ANSI bright red color
    brightGreen?: string; // ANSI bright green color
    brightYellow?: string; // ANSI bright yellow color
    brightBlue?: string; // ANSI bright blue color
    brightMagenta?: string; // ANSI bright magenta color
    brightCyan?: string; // ANSI bright cyan color
    brightWhite?: string; // ANSI bright white color
  };

  /** Font size in pixels (default: 14) */
  fontSize?: number;

  /**
   * Font family for the terminal text
   * Should be a monospace font for proper terminal display
   */
  fontFamily?: string;

  /** Number of columns in the terminal (default: 80) */
  cols?: number;

  /** Number of rows in the terminal (default: 24) */
  rows?: number;

  /** Callback fired when the terminal is ready for use */
  onReady?: () => void;

  /** Callback fired when the terminal is closed */
  onClose: () => void;

  /**
   * Callback fired when an error occurs
   * @param error - Error message describing what went wrong
   */
  onError?: (error: string) => void;

  /**
   * Callback fired when data is received from the terminal
   * @param data - The data that was received
   */
  onDataReceived?: (data: string) => void;

  /** Additional CSS classes to apply to the terminal container */
  className?: string;

  /** Inline styles to apply to the terminal container */
  style?: React.CSSProperties;

  /**
   * Session identifier for the terminal
   * Used to distinguish between different terminal sessions
   */
  sessionId: string | null;

  /**
   * Whether to automatically reconnect when the session changes
   * (default: true)
   */
  autoReconnect?: boolean;
}

/**
 * Interface for the methods exposed by the Terminal component
 *
 * These methods can be called by parent components using a ref.
 * This provides programmatic control over the terminal instance.
 */
export interface TerminalRef {
  /**
   * Write data to the terminal display
   * @param data - The data to write (can include ANSI escape sequences)
   */
  writeData: (data: string) => void;

  /** Clear the terminal screen */
  clear: () => void;

  /** Give focus to the terminal (allows keyboard input) */
  focus: () => void;

  /** Remove focus from the terminal */
  blur: () => void;

  /**
   * Resize the terminal
   * @param cols - Number of columns (optional, will auto-fit if not provided)
   * @param rows - Number of rows (optional, will auto-fit if not provided)
   */
  resize: (cols?: number, rows?: number) => void;

  /**
   * Get the currently selected text
   * @returns The selected text as a string
   */
  getSelection: () => string;

  /** Select all text in the terminal */
  selectAll: () => void;

  /**
   * Search for text in the terminal
   * @param term - The text to search for
   * @returns true if the term was found, false otherwise
   */
  search: (term: string) => boolean;

  /**
   * Find the next occurrence of a search term
   * @param term - The text to search for
   * @returns true if the term was found, false otherwise
   */
  findNext: (term: string) => boolean;

  /**
   * Find the previous occurrence of a search term
   * @param term - The text to search for
   * @returns true if the term was found, false otherwise
   */
  findPrevious: (term: string) => boolean;

  /** Scroll to the bottom of the terminal */
  scrollToBottom: () => void;

  /** Scroll to the top of the terminal */
  scrollToTop: () => void;

  /** Reset the terminal to its initial state */
  reset: () => void;

  /** Clean up and dispose of the terminal instance */
  dispose: () => void;

  /** Reconnect the terminal session */
  reconnect: () => void;

  /**
   * Check if the terminal is ready for use
   * @returns true if the terminal is initialized and ready
   */
  isReady: () => boolean;
}

/**
 * Default colour theme for the terminal.
 *
 * The surface colours come from `lib/tokens` so the terminal is the same
 * material as the editor rather than a slightly different shade of dark
 * sitting next to it. xterm parses these itself and takes hex only.
 *
 * The 16 ANSI slots are deliberately *not* rebranded. Programs choose these
 * by index and users read them by convention — green means passed, red means
 * failed. Retinting them to fit a palette would be actively user-hostile, so
 * they stay a conventional set, only nudged for legibility on a near-black
 * background.
 */
const defaultTheme = {
  background: token.termBg,
  foreground: token.termInk,
  cursor: token.brand500,
  cursorAccent: token.termBg,
  selectionBackground: "#ffffff26",

  black: "#1c1c1c",
  red: "#f0524f",
  green: "#5cba6a",
  yellow: "#e0b040",
  blue: "#4a8fe0",
  magenta: "#c464c4",
  cyan: "#3ba9c4",
  white: "#c7c7c7",
  brightBlack: "#5c5c5c",
  brightRed: "#ff6b6b",
  brightGreen: "#73d68a",
  brightYellow: "#f2cc60",
  brightBlue: "#6aa9f0",
  brightMagenta: "#dc8adc",
  brightCyan: "#5cc4dd",
  brightWhite: "#f2f2f2",
};

/**
 * Terminal Component
 *
 * A React component that wraps xterm.js to provide terminal functionality.
 * This component handles the lifecycle of the terminal, including initialization,
 * cleanup, and all user interactions.
 *
 * @example
 * ```tsx
 * const terminalRef = useRef<TerminalRef>(null);
 *
 * return (
 *   <TerminalComponent
 *     ref={terminalRef}
 *     onSendData={(data) => console.log('User typed:', data)}
 *     onRequestTerminal={() => console.log('Terminal requested')}
 *     theme={{ background: '#000000', foreground: '#ffffff' }}
 *     fontSize={16}
 *   />
 * );
 * ```
 */
const TerminalComponent = forwardRef<TerminalRef, TerminalProps>(
  (
    {
      onSendData,
      onRequestTerminal,
      onTerminalResize,
      theme = defaultTheme,
      fontSize = 14,
      fontFamily = mono.style.fontFamily,
      cols = 80,
      rows = 24,
      onReady,
      onClose,
      onError,
      onDataReceived,
      className = "",
      style = {},
      sessionId,
      autoReconnect = true,
    },
    ref,
  ) => {
    // ===== STATE MANAGEMENT =====

    /** Reference to the DOM element that will contain the terminal */
    const terminalRef = useRef<HTMLDivElement>(null);

    /** Reference to the xterm.js Terminal instance */
    const xtermRef = useRef<any>(null);

    /** Reference to the FitAddon for automatic terminal resizing */
    const fitAddonRef = useRef<any>(null);

    /** Reference to the SearchAddon for text searching functionality */
    const searchAddonRef = useRef<any>(null);

    /** State indicating whether the terminal is ready for use */
    const [isReady, setIsReady] = useState(false);

    /** State for storing any error messages */
    const [error, setError] = useState<string | null>(null);

    /** Buffer for storing data that arrives before the terminal is ready */
    const pendingDataRef = useRef<string[]>([]);

    // ===== INITIALIZATION TRACKING =====

    /**
     * Ref to track initialization state
     * We use a ref instead of state to avoid triggering re-renders
     */
    const isInitializedRef = useRef(false);

    /**
     * Track if terminal connection has been requested
     * Prevents infinite connection requests
     */
    const terminalRequestedRef = useRef(false);

    /**
     * Store the current session ID to detect changes
     * Used for session management and reconnection logic
     */
    const currentSessionIdRef = useRef<string | null>(sessionId);

    // ===== CORE FUNCTIONALITY =====

    /**
     * Initialize the terminal instance
     *
     * This function handles the complete setup of the xterm.js terminal:
     * 1. Dynamically imports required modules (code splitting)
     * 2. Creates and configures the terminal instance
     * 3. Sets up all necessary addons (fit, search, web links)
     * 4. Establishes event listeners
     * 5. Performs initial setup and displays welcome message
     *
     * @returns Promise<boolean> - true if initialization was successful
     */
    const initializeTerminal = useCallback(async () => {
      console.log(
        "Checking initialization:",
        terminalRef.current,
        isInitializedRef.current,
      );

      // Ensure we have a DOM element to attach to
      if (!terminalRef.current) {
        console.error("Terminal container ref is not available");
        return false;
      }

      // Prevent double initialization
      if (isInitializedRef.current) {
        console.log("Terminal already initialized");
        return true;
      }

      try {
        console.log("Initializing terminal...");

        // Dynamic imports for code splitting
        // This allows the terminal libraries to be loaded only when needed
        const { Terminal } = await import("@xterm/xterm");
        const { FitAddon } = await import("@xterm/addon-fit");
        const { WebLinksAddon } = await import("@xterm/addon-web-links");
        const { SearchAddon } = await import("@xterm/addon-search");

        // Create the main terminal instance with configuration
        const terminal = new Terminal({
          cols, // Number of columns
          rows, // Number of rows
          fontSize, // Font size in pixels
          fontFamily, // Font family (must be monospace)
          theme: { ...defaultTheme, ...theme }, // Merge default and custom themes
          cursorBlink: true, // Enable cursor blinking
          cursorStyle: "block", // Block cursor style
          scrollback: 10000, // Number of lines to keep in scrollback buffer
          convertEol: true, // Convert \n to \r\n automatically
          allowTransparency: true, // Allow transparent backgrounds
        });

        // Create addon instances
        // FitAddon: Automatically resizes terminal to fit container
        const fitAddon = new FitAddon();
        // WebLinksAddon: Makes URLs clickable
        const webLinksAddon = new WebLinksAddon();
        // SearchAddon: Enables text search functionality
        const searchAddon = new SearchAddon();

        // Load addons into the terminal
        terminal.loadAddon(fitAddon);
        terminal.loadAddon(webLinksAddon);
        terminal.loadAddon(searchAddon);

        // Attach terminal to DOM element
        terminal.open(terminalRef.current);

        // Store references for later use
        xtermRef.current = terminal;
        fitAddonRef.current = fitAddon;
        searchAddonRef.current = searchAddon;

        // ===== EVENT LISTENERS =====

        /**
         * Handle user input (typing, pasting, etc.)
         * This event fires whenever the user interacts with the terminal
         */
        terminal.onData((data: string) => {
          onSendData?.(data); // Notify parent of user input
          onDataReceived?.(data); // Notify parent of data received
        });

        /**
         * Handle terminal resize events
         * This event fires when the terminal dimensions change
         */
        terminal.onResize(({ cols, rows }: { cols: number; rows: number }) => {
          onTerminalResize?.(cols, rows);
        });

        // ===== INITIAL SETUP =====

        /**
         * Fit terminal to container size
         * We use setTimeout to ensure the DOM is fully rendered
         */
        setTimeout(() => {
          try {
            fitAddon.fit();
            console.log("Terminal fitted to container");
          } catch (error) {
            console.warn("Failed to fit terminal:", error);
          }
        }, 100);

        // Mark as initialized BEFORE setting other states
        // This prevents race conditions during initialization
        isInitializedRef.current = true;
        setIsReady(true);
        setError(null);

        // Process any data that arrived before initialization
        if (pendingDataRef.current.length > 0) {
          const pendingData = pendingDataRef.current.join("");
          pendingDataRef.current = [];
          terminal.write(pendingData);
        }

        // Notify parent that terminal is ready
        onReady?.();

        // Request terminal connection only if not already requested
        if (!terminalRequestedRef.current) {
          console.log("Requesting terminal connection...");
          onRequestTerminal?.();
          terminalRequestedRef.current = true;
        }

        // Display welcome message with ANSI escape sequences
        // \x1b[2J clears the screen, \x1b[H moves cursor to home position
        // \x1b[32m sets green color, \x1b[0m resets color
        terminal.write("\x1b[2J\x1b[H");
        terminal.write("\x1b[32m🖥️ Terminal ready\x1b[0m\r\n");

        console.log("Terminal initialization successful");
        return true;
      } catch (error) {
        console.error("Terminal initialization failed:", error);
        setError(`Failed to initialize terminal: ${error}`);
        onError?.(`Failed to initialize terminal: ${error}`);
        return false;
      }
    }, [
      cols,
      rows,
      fontSize,
      fontFamily,
      theme,
      onSendData,
      onDataReceived,
      onTerminalResize,
      onReady,
      onRequestTerminal,
      onError,
    ]);

    /**
     * Handle terminal resize events
     *
     * This function is called when the browser window is resized
     * or when the terminal container changes size.
     */
    const handleResize = useCallback(() => {
      if (fitAddonRef.current && isReady) {
        try {
          fitAddonRef.current.fit();
        } catch (error) {
          console.warn("Failed to resize terminal:", error);
        }
      }
    }, [isReady]);

    // ===== LIFECYCLE EFFECTS =====

    /**
     * Initialize terminal on component mount
     *
     * This effect runs once when the component mounts and handles:
     * 1. Terminal initialization
     * 2. Retry logic on failure
     * 3. Cleanup on unmount
     */
    useEffect(() => {
      let mounted = true; // Track if component is still mounted
      let timeoutId: NodeJS.Timeout;

      /**
       * Async initialization function
       * We use a separate async function because useEffect cannot be async
       */
      const init = async () => {
        // Wait for next tick to ensure DOM is ready
        await new Promise((resolve) => setTimeout(resolve, 0));

        console.log(
          "Init check:",
          mounted,
          terminalRef.current,
          !isInitializedRef.current,
        );

        // Only initialize if component is still mounted and not already initialized
        if (mounted && terminalRef.current && !isInitializedRef.current) {
          const success = await initializeTerminal();

          // Retry once on failure
          if (!success && mounted) {
            timeoutId = setTimeout(async () => {
              if (mounted && !isInitializedRef.current) {
                await initializeTerminal();
              }
            }, 1000);
          }
        }
      };

      init();

      // Cleanup function
      return () => {
        mounted = false;
        clearTimeout(timeoutId);
        console.log("Cleanup: disposing terminal");

        onClose();
        // Cleanup terminal instance
        if (xtermRef.current) {
          try {
            xtermRef.current.dispose();
          } catch (error) {
            console.warn("Error disposing terminal:", error);
          }
          xtermRef.current = null;
        }

        // Reset all refs and state
        fitAddonRef.current = null;
        searchAddonRef.current = null;
        isInitializedRef.current = false;
        terminalRequestedRef.current = false;
        setIsReady(false);
        pendingDataRef.current = [];
      };
    }, []); // Empty dependency array - only run on mount/unmount

    /**
     * Handle window and container resize events
     *
     * This effect sets up resize observers to automatically adjust
     * the terminal size when the container or window changes size.
     */
    useEffect(() => {
      // ResizeObserver watches for changes to the terminal container size
      const resizeObserver = new ResizeObserver(handleResize);

      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }

      // Also listen for window resize events
      window.addEventListener("resize", handleResize);

      return () => {
        resizeObserver.disconnect();
        window.removeEventListener("resize", handleResize);
      };
    }, [handleResize]);

    /**
     * Handle session changes
     *
     * This effect monitors changes to the session ID and can trigger
     * reconnection logic when the session changes.
     */
    useEffect(() => {
      // Check if session ID actually changed
      const sessionChanged = currentSessionIdRef.current !== sessionId;
      currentSessionIdRef.current = sessionId;
    }, [sessionId, isReady, autoReconnect]);

    // ===== IMPERATIVE HANDLE =====

    /**
     * Expose terminal methods to parent components via ref
     *
     * This allows parent components to programmatically control the terminal
     * by calling methods like terminalRef.current.writeData("Hello")
     */
    useImperativeHandle(
      ref,
      () => ({
        /**
         * Write data to the terminal
         * If terminal is not ready, data is queued for later
         */
        writeData: (data: string) => {
          if (!data) return;

          if (xtermRef.current && isReady) {
            try {
              xtermRef.current.write(data);
            } catch (error) {
              console.warn("Failed to write data:", error);
              // Queue data if write fails
              pendingDataRef.current.push(data);
            }
          } else {
            // Queue data if terminal not ready
            pendingDataRef.current.push(data);
          }
        },

        /** Clear the terminal screen */
        clear: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.clear();
          }
        },

        /** Focus the terminal for keyboard input */
        focus: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.focus();
          }
        },

        /** Remove focus from the terminal */
        blur: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.blur();
          }
        },

        /** Resize the terminal to specified dimensions or auto-fit */
        resize: (newCols?: number, newRows?: number) => {
          if (xtermRef.current && isReady) {
            if (newCols && newRows) {
              try {
                xtermRef.current.resize(newCols, newRows);
              } catch (error) {
                console.warn("Failed to resize terminal:", error);
              }
            } else {
              // Auto-fit to container
              handleResize();
            }
          }
        },

        /** Get currently selected text */
        getSelection: () => {
          return xtermRef.current?.getSelection() || "";
        },

        /** Select all text in the terminal */
        selectAll: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.selectAll();
          }
        },

        /** Search for text in the terminal */
        search: (term: string) => {
          if (searchAddonRef.current && isReady) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        /** Find next occurrence of search term */
        findNext: (term: string) => {
          if (searchAddonRef.current && isReady) {
            return searchAddonRef.current.findNext(term);
          }
          return false;
        },

        /** Find previous occurrence of search term */
        findPrevious: (term: string) => {
          if (searchAddonRef.current && isReady) {
            return searchAddonRef.current.findPrevious(term);
          }
          return false;
        },

        /** Scroll to bottom of terminal */
        scrollToBottom: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.scrollToBottom();
          }
        },

        /** Scroll to top of terminal */
        scrollToTop: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.scrollToTop();
          }
        },

        /** Reset terminal to initial state */
        reset: () => {
          if (xtermRef.current && isReady) {
            xtermRef.current.reset();
            pendingDataRef.current = [];
          }
        },

        /** Dispose of terminal instance and clean up */
        dispose: () => {
          if (xtermRef.current) {
            try {
              xtermRef.current.dispose();
            } catch (error) {
              console.warn("Error disposing terminal:", error);
            }
            xtermRef.current = null;
          }
          isInitializedRef.current = false;
          terminalRequestedRef.current = false;
          setIsReady(false);
          pendingDataRef.current = [];
        },

        /** Reconnect the terminal session */
        reconnect: () => {
          if (!isInitializedRef.current) {
            terminalRequestedRef.current = false;
            initializeTerminal();
          } else if (isReady && !terminalRequestedRef.current) {
            console.log("Reconnecting terminal...");
            onRequestTerminal?.();
            terminalRequestedRef.current = true;
          }
        },

        /** Check if terminal is ready for use */
        isReady: () => {
          return isReady;
        },
      }),
      [isReady, handleResize, initializeTerminal, onRequestTerminal],
    );

    // ===== RENDER =====

    /**
     * Error state rendering
     *
     * If an error occurs during initialization, show an error message
     * with a retry button to attempt reinitialization.
     */
    if (error) {
      return (
        <div
          className={`terminal-container ${className}`}
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: defaultTheme.background,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: defaultTheme.red,
            fontFamily,
            ...style,
          }}
        >
          <div className="text-center">
            <div>Terminal Error</div>
            <div className="text-sm mt-2">{error}</div>
            <button
              onClick={() => {
                // Reset error state and retry initialization
                setError(null);
                isInitializedRef.current = false;
                terminalRequestedRef.current = false;
                setIsReady(false);
                initializeTerminal();
              }}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    /**
     * Main terminal rendering
     *
     * Renders the terminal container with a loading indicator
     * when the terminal is not yet ready.
     */
    return (
      <div
        className={`terminal-container ${className}`}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          ...style,
        }}
      >
        {/* Loading indicator shown while terminal initializes */}
        {!isReady && (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            <span>Loading terminal...</span>
          </div>
        )}

        {/* Terminal container - xterm.js will attach here */}
        <div
          ref={terminalRef}
          className="terminal"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    );
  },
);

// Set display name for debugging purposes
TerminalComponent.displayName = "TerminalComponent";


/**
 * Memoised because the sandbox shell above it owns eleven pieces of chrome
 * state — sidebar open, active panel, settings dialog, terminal maximised and
 * so on. Without this, toggling any one of them re-rendered this subtree too.
 */
export default React.memo(TerminalComponent);
