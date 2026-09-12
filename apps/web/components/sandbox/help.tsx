import { useEffect, useState } from "react";

interface ShortcutKeysPopupProps {
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  icon: string;
  shortcuts: {
    keys: string;
    description: string;
    context?: string;
  }[];
}

export default function ShortcutKeysPopup({ onClose }: ShortcutKeysPopupProps) {
  const [isMounted, setIsMounted] = useState(false);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleClose = () => {
    setIsMounted(false);
    setTimeout(onClose, 300);
  };

  const shortcutCategories: ShortcutCategory[] = [
    {
      title: "General",
      icon: "💻",
      shortcuts: [
        { keys: "Ctrl+Shift+P", description: "Open Settings" },
        { keys: "Escape", description: "Focus Editor" },
        { keys: "Ctrl+1", description: "Focus Editor" },
        { keys: "Ctrl+2", description: "Focus Terminal" },
      ],
    },
    {
      title: "Sidebar & Panels",
      icon: "📂",
      shortcuts: [
        { keys: "Ctrl+B", description: "Toggle Sidebar" },
        { keys: "Ctrl+Shift+E", description: "Focus Explorer" },
        { keys: "Ctrl+`", description: "Toggle Terminal" },
        { keys: "Ctrl+Shift+Y", description: "Toggle Output Panel" },
      ],
    },
    {
      title: "Terminal",
      icon: "⚡",
      shortcuts: [
        {
          keys: "Ctrl+Shift+C",
          description: "Clear Terminal",
          context: "terminal",
        },
        {
          keys: "Ctrl+Shift+R",
          description: "Reset Terminal",
          context: "terminal",
        },
        {
          keys: "Ctrl+Shift+F",
          description: "Search in Terminal",
          context: "terminal",
        },
      ],
    },
    {
      title: "Editor",
      icon: "📝",
      shortcuts: [
        { keys: "Ctrl+Shift+I", description: "Format Document" },
        { keys: "Ctrl+Shift+K", description: "Delete Current Line" },
        { keys: "Ctrl+D", description: "Add Selection to Next Find Match" },
        { keys: "Ctrl+L", description: "Select Current Line" },
        { keys: "Ctrl+/", description: "Toggle Line Comment" },
        { keys: "Ctrl+Shift+/", description: "Toggle Block Comment" },
        { keys: "Alt+↑/↓", description: "Move Line Up/Down" },
        { keys: "Shift+Alt+↑/↓", description: "Copy Line Up/Down" },
        { keys: "Ctrl+F", description: "Find" },
        { keys: "Ctrl+H", description: "Replace" },
        { keys: "Ctrl+G", description: "Go to Line" },
        { keys: "Ctrl+Shift+O", description: "Go to Symbol" },
        { keys: "F2", description: "Rename Symbol" },
        { keys: "Ctrl+Space", description: "Trigger Suggestion" },
        { keys: "Ctrl+.", description: "Quick Fix" },
      ],
    },
  ];

  const renderShortcutKey = (keys: string) => {
    return keys.split("+").map((key, index, array) => (
      <span key={index} className="inline-flex items-center">
        <kbd className="px-2 py-1 text-xs font-mono bg-raised border border-zinc-600 rounded shadow-sm">
          {key}
        </kbd>
        {index < array.length - 1 && (
          <span className="mx-1 text-zinc-500 text-xs">+</span>
        )}
      </span>
    ));
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex h-screen w-full items-center justify-center transition-all duration-300 ${
        isMounted ? "bg-canvas/40 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <div
        className={`w-full max-w-4xl border-dashed border-2 border-zinc-400 rounded-none shadow-none bg-surface transition-all duration-300 max-h-[90vh] overflow-hidden ${
          isMounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
        }`}
      >
        <div className="border-b border-dashed pb-4 flex flex-row items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <span className="text-brand">⌨️</span>
            <span className="text-sm font-mono">Keyboard Shortcuts</span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-raised transition-colors rounded"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="font-mono p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shortcutCategories.map((category) => (
              <div
                key={category.title}
                className="border border-dashed border-edge p-4 bg-raised/50"
              >
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-dashed border-edge">
                  <span className="text-brand">{category.icon}</span>
                  <span className="text-sm font-medium text-brand">
                    {category.title}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-ink-muted">
                          {shortcut.description}
                        </span>
                        {shortcut.context && (
                          <span className="text-zinc-500 text-xs px-2 py-1 bg-raised border border-zinc-600 rounded">
                            {shortcut.context}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {renderShortcutKey(shortcut.keys)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Command Palette Style Status */}
          <div className="mt-6 pt-4 border-t border-dashed border-edge">
            <div className="flex items-center gap-2">
              <span className="text-brand">$</span>
              <span className="text-sm">shortcuts.getAll()</span>
            </div>
            <div className="pl-6 mt-2 text-xs text-ink-subtle flex flex-col gap-1">
              <div>platform: {navigator.platform}</div>
              <div>
                total shortcuts:{" "}
                {shortcutCategories.reduce(
                  (acc, cat) => acc + cat.shortcuts.length,
                  0,
                )}
              </div>
              <div>context-aware: enabled</div>
              <div className="flex items-center gap-1">
                tip: Use
                <kbd className="px-1 py-0.5 bg-raised border border-zinc-600 rounded text-xs mx-1">
                  Ctrl+Shift+P
                </kbd>
                to access settings
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
