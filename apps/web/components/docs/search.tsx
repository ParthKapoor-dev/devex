"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { isTypingTarget } from "@/lib/keyboard";

export interface SearchDoc {
  title: string;
  description: string;
  url: string;
  section: string;
  excerpt: string;
}

/**
 * Docs search.
 *
 * The index is built at build time and passed down from the layout, so search
 * is entirely client-side: no API round trip, no Algolia, no WASM. The corpus
 * is a few dozen pages, which is well within what a linear scan handles inside
 * one frame.
 */
export function DocsSearch({ docs }: { docs: SearchDoc[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];

    const terms = needle.split(/\s+/);

    return docs
      .map((doc) => {
        const title = doc.title.toLowerCase();
        const description = doc.description.toLowerCase();
        const excerpt = doc.excerpt.toLowerCase();

        let score = 0;
        for (const term of terms) {
          // Weight by where the term matched: a title hit means far more than
          // a body hit.
          if (title === term) score += 100;
          else if (title.startsWith(term)) score += 50;
          else if (title.includes(term)) score += 30;
          else if (description.includes(term)) score += 10;
          else if (excerpt.includes(term)) score += 3;
          else return null;
        }
        return { doc, score };
      })
      .filter((hit): hit is { doc: SearchDoc; score: number } => hit !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((hit) => hit.doc);
  }, [docs, query]);

  React.useEffect(() => setSelected(0), [query]);

  /**
   * `/` to open, not Cmd/Ctrl-K.
   *
   * This used to bind the same chord as the command palette, which is mounted
   * in the header on every page — so on the docs one keystroke opened both,
   * stacked, and the palette (later in the DOM, higher z-index) took the
   * focus. `/` is the long-standing convention for "search this site" and is
   * the key nobody else here wants.
   *
   * A bare key needs the typing guard, or it eats the character the moment
   * anyone types a path or a regex into a field.
   */
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      event.preventDefault();
      setOpen(true);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  const go = React.useCallback(
    (url: string) => {
      setOpen(false);
      router.push(url);
    },
    [router],
  );

  const onInputKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      go(results[selected].url);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-edge bg-surface px-3 py-2 text-sm text-ink-subtle transition-colors duration-[--duration-fast] hover:border-brand/40 hover:text-ink-muted"
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="flex-1 text-left">Search docs</span>
        <kbd className="hidden rounded border border-edge px-1.5 py-0.5 font-mono text-[10px] text-ink-subtle sm:inline-block">
          /
        </kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Close search"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search documentation"
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-edge bg-overlay shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-edge px-4">
              <Search
                className="size-4 shrink-0 text-ink-subtle"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search documentation…"
                aria-label="Search documentation"
                className="flex-1 bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-ink-subtle"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close search"
                className="rounded p-1 text-ink-subtle hover:text-ink"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {query.trim().length < 2 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-subtle">
                  Type at least two characters
                </p>
              ) : results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-subtle">
                  No matches for “{query}”
                </p>
              ) : (
                <ul>
                  {results.map((doc, index) => (
                    <li key={doc.url}>
                      <button
                        type="button"
                        onClick={() => go(doc.url)}
                        onMouseEnter={() => setSelected(index)}
                        className={cn(
                          "w-full rounded-md px-3 py-2.5 text-left transition-colors duration-[--duration-fast]",
                          index === selected ? "bg-raised" : "hover:bg-raised",
                        )}
                      >
                        <div className="flex items-baseline gap-2">
                          <span className="font-medium text-ink">
                            {doc.title}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider text-ink-subtle">
                            {doc.section}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
                          {doc.description}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* A key legend. The dialog is fully keyboard-driven — arrows,
                enter, escape — and nothing on screen said so, which meant the
                only people who found out were the ones who tried. */}
            <div className="flex items-center gap-4 border-t border-edge px-4 py-2.5 font-mono text-[10px] text-ink-subtle">
              <span className="flex items-center gap-1.5">
                <Cap>↑</Cap>
                <Cap>↓</Cap>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <Cap>↵</Cap>
                open
              </span>
              <span className="flex items-center gap-1.5">
                <Cap>esc</Cap>
                close
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Cap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-edge bg-raised px-1 leading-none">
      {children}
    </kbd>
  );
}
