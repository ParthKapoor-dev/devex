"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModifierKey } from "@/hooks/use-modifier-key";

/**
 * The keyboard shortcut reference.
 *
 * The other panel that never made it onto the design system: a
 * `border-dashed border-2 border-zinc-400` frame — a light grey dashed box in
 * a dark IDE — with `border-zinc-600` key caps, `text-zinc-500` labels, and an
 * emoji per section heading.
 *
 * Two real bugs went with the styling:
 *
 * - **`navigator.platform` was read during render.** It does not exist on the
 *   server, so this line threw on any render that was not client-only, and it
 *   is deprecated besides. It was also printing the raw UA platform string to
 *   the user as if that were useful.
 * - **The Escape handler re-subscribed on every render**, because the effect
 *   listed a handler redeclared in the component body as its dependency.
 *
 * Shortcuts are written with a `mod` token rather than a literal `Ctrl`, so
 * the sheet shows `⌘` on Apple keyboards and `Ctrl` everywhere else — the
 * handlers accept either, and the sheet used to tell everyone `Ctrl`.
 */

interface ShortcutKeysPopupProps {
  onClose: () => void;
}

interface ShortcutCategory {
  title: string;
  shortcuts: {
    keys: string;
    description: string;
    context?: string;
  }[];
}

const EXIT_MS = 150;

const CATEGORIES: ShortcutCategory[] = [
  {
    title: "General",
    shortcuts: [
      { keys: "mod+Shift+P", description: "Editor settings" },
      { keys: "mod+1", description: "Focus editor" },
      { keys: "mod+2", description: "Focus terminal" },
      { keys: "Escape", description: "Back to the editor" },
      { keys: "?", description: "This sheet" },
    ],
  },
  {
    title: "Panels",
    shortcuts: [
      { keys: "mod+B", description: "Toggle the sidebar" },
      { keys: "mod+Shift+E", description: "Focus the explorer" },
      { keys: "mod+`", description: "Toggle the terminal" },
      { keys: "mod+Shift+Y", description: "Toggle the output panel" },
    ],
  },
  {
    title: "Terminal",
    shortcuts: [
      {
        keys: "mod+Shift+C",
        description: "Clear the buffer",
        context: "terminal",
      },
      {
        keys: "mod+Shift+R",
        description: "Restart the session",
        context: "terminal",
      },
      {
        keys: "mod+Shift+F",
        description: "Search the buffer",
        context: "terminal",
      },
    ],
  },
  {
    title: "Editor",
    shortcuts: [
      { keys: "mod+Shift+I", description: "Format the document" },
      { keys: "mod+Shift+K", description: "Delete the line" },
      { keys: "mod+D", description: "Add the next match to the selection" },
      { keys: "mod+L", description: "Select the line" },
      { keys: "mod+/", description: "Toggle a line comment" },
      { keys: "Alt+↑ ↓", description: "Move the line" },
      { keys: "Shift+Alt+↑ ↓", description: "Copy the line" },
      { keys: "mod+F", description: "Find" },
      { keys: "mod+H", description: "Replace" },
      { keys: "mod+G", description: "Go to line" },
      { keys: "F2", description: "Rename the symbol" },
      { keys: "mod+.", description: "Quick fix" },
    ],
  },
];

export default function ShortcutKeysPopup({ onClose }: ShortcutKeysPopupProps) {
  const [isMounted, setIsMounted] = useState(false);
  const modifier = useModifierKey();

  useEffect(() => setIsMounted(true), []);

  const handleClose = useCallback(() => {
    setIsMounted(false);
    window.setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  // One subscription for the life of the sheet.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  const total = CATEGORIES.reduce((sum, c) => sum + c.shortcuts.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close shortcuts"
        onClick={handleClose}
        className={cn(
          "absolute inset-0 cursor-default transition-colors duration-[--duration-normal]",
          isMounted ? "bg-canvas/70 backdrop-blur-sm" : "bg-transparent",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className={cn(
          "relative flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden",
          "rounded-lg border border-edge bg-surface",
          "shadow-[0_24px_64px_-24px_rgb(0_0_0/0.9)]",
          "transition-[opacity,transform] duration-[--duration-normal] ease-[--ease-out-circ]",
          isMounted ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <header className="flex shrink-0 items-center gap-3 border-b border-edge px-3 py-2">
          <span className="label text-ink">Keyboard</span>
          <span className="font-mono text-xs tabular-nums text-ink-subtle">
            {total}
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close shortcuts"
            className="ml-auto rounded-sm p-1 text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-px bg-edge sm:grid-cols-2">
            {CATEGORIES.map((category) => (
              <section key={category.title} className="bg-canvas p-4">
                <h3 className="label mb-3 text-ink-subtle">{category.title}</h3>
                <dl className="space-y-2">
                  {category.shortcuts.map((shortcut) => (
                    <div
                      key={shortcut.keys}
                      className="flex items-baseline justify-between gap-4"
                    >
                      <dt className="min-w-0 text-sm text-ink-muted">
                        {shortcut.description}
                        {shortcut.context ? (
                          <span className="ml-2 font-mono text-[10px] text-ink-subtle">
                            {shortcut.context}
                          </span>
                        ) : null}
                      </dt>
                      <dd className="flex shrink-0 items-center gap-1">
                        <Keys keys={shortcut.keys} modifier={modifier} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>

        <footer className="shrink-0 border-t border-edge px-4 py-2.5 font-mono text-[11px] text-ink-subtle">
          Shortcuts marked{" "}
          <span className="text-ink-muted">{"{context}"}</span> only fire while
          that panel has focus.
        </footer>
      </div>
    </div>
  );
}

function Keys({ keys, modifier }: { keys: string; modifier: string }) {
  const parts = keys.split("+");

  return (
    <>
      {parts.map((part, index) => (
        <span key={`${part}-${index}`} className="inline-flex items-center">
          {index > 0 ? (
            <span className="mx-0.5 text-[10px] text-ink-subtle">+</span>
          ) : null}
          <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-edge bg-raised px-1.5 font-mono text-[10px] leading-none text-ink-muted">
            {part === "mod" ? modifier : part}
          </kbd>
        </span>
      ))}
    </>
  );
}
