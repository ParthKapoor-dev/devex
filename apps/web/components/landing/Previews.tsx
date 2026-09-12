"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useActiveInView } from "@/hooks/use-active-in-view";

/**
 * The product shot under the hero.
 *
 * Built rather than screenshotted, because it is the only place the marketing
 * page shows what the product actually looks like — and because a real DOM
 * mock re-themes with the tokens and stays sharp on any display, which a PNG
 * does not.
 *
 * It mirrors the real IDE's chrome deliberately: the same tab strip, the same
 * amber-marks-the-open-file rule, the same monospace status bar along the
 * bottom. A marketing shot that does not match the product is worse than no
 * shot, because the mismatch is the first thing a new user notices.
 *
 * It is also the *only* animated thing below the fold: one line of type-on
 * text, which stops permanently once it finishes. The version before this ran
 * three uncapped timers with no reduced-motion branch and no check for whether
 * it was on screen.
 */

const TREE = [
  { name: "src", depth: 0, dir: true },
  { name: "index.ts", depth: 1, active: true },
  { name: "server.ts", depth: 1 },
  { name: "routes", depth: 1, dir: true },
  { name: "package.json", depth: 0 },
  { name: "Dockerfile", depth: 0 },
];

const CODE: { text: string; tone?: "kw" | "str" | "fn" | "com" | "num" }[][] = [
  [
    { text: "import", tone: "kw" },
    { text: " { serve } " },
    { text: "from", tone: "kw" },
    { text: " " },
    { text: '"./server"', tone: "str" },
  ],
  [],
  [{ text: "// one container, one session", tone: "com" }],
  [{ text: "const", tone: "kw" }, { text: " port = " }, { text: "3000", tone: "num" }],
  [],
  [{ text: "serve", tone: "fn" }, { text: "({ port }, () => {" }],
  [
    { text: "  console." },
    { text: "log", tone: "fn" },
    { text: "(" },
    { text: "`up on :${port}`", tone: "str" },
    { text: ")" },
  ],
  [{ text: "})" }],
];

const TONE: Record<string, string> = {
  kw: "text-[#c4a3ff]",
  str: "text-[#8fd4a8]",
  fn: "text-[#9cc7f0]",
  com: "text-ink-subtle italic",
  num: "text-brand-300",
};

const TERMINAL_LINE = "npm run dev";

export default function Preview() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const active = useActiveInView(hostRef);
  const [typed, setTyped] = useState(0);

  const done = typed >= TERMINAL_LINE.length;

  useEffect(() => {
    // Type once, then never run again — no loop, no restart on re-entry.
    if (reducedMotion || !active || done) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), 55);
    return () => window.clearTimeout(id);
  }, [reducedMotion, active, done, typed]);

  const shown = reducedMotion ? TERMINAL_LINE : TERMINAL_LINE.slice(0, typed);
  const finished = reducedMotion || done;

  return (
    <div ref={hostRef} className="mx-auto mt-16 w-full max-w-5xl text-left">
      <div className="overflow-hidden rounded-lg border border-edge bg-surface shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_32px_80px_-24px_rgb(0_0_0/0.8)]">
        {/* Title bar. The three grey circles that used to sit here were a
            macOS window's traffic lights, drawn on something that is not a
            macOS window — the same fake chrome that came out of the dashboard.
            The space says what the workspace is instead. */}
        <div className="flex h-9 items-center gap-3 border-b border-edge bg-surface px-3">
          <span className="truncate font-mono text-xs text-ink-muted">
            devex<span className="text-ink-subtle"> / </span>api
          </span>
          <span className="rounded-xs border border-edge px-1.5 py-px font-mono text-[10px] text-ink-subtle">
            node:20
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 font-mono text-[11px] text-term-accent">
            <span
              className="size-1.5 rounded-full bg-term-accent"
              aria-hidden="true"
            />
            running
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[172px_1fr]">
          {/* Explorer */}
          <aside className="hidden border-r border-edge py-1.5 sm:block">
            <p className="label px-3 pb-1.5 pt-1 text-[9px] text-ink-subtle">
              Explorer
            </p>
            {TREE.map((entry) => (
              <div
                key={entry.name}
                style={{ paddingLeft: `${entry.depth * 12 + 12}px` }}
                className={cn(
                  "relative flex items-center py-[3px] pr-2 font-mono text-xs",
                  "before:absolute before:inset-y-0 before:left-0 before:w-0.5",
                  entry.active
                    ? "bg-raised text-ink before:bg-brand"
                    : "text-ink-subtle before:bg-transparent",
                )}
              >
                {entry.name}
              </div>
            ))}
          </aside>

          <div className="min-w-0">
            {/* Tab strip — the same shape the real editor uses, down to the
                amber underline marking the open file. */}
            <div className="flex h-8 items-stretch border-b border-edge bg-surface">
              <span className="relative inline-flex items-center gap-2 border-r border-edge bg-term-bg px-3 font-mono text-xs text-ink">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-brand"
                />
                index.ts
                <span className="size-1.5 rounded-full bg-ink-subtle" />
              </span>
              <span className="inline-flex items-center border-r border-edge px-3 font-mono text-xs text-ink-subtle">
                server.ts
              </span>
            </div>

            {/* Editor */}
            <div className="overflow-x-auto bg-term-bg px-4 py-3">
              <pre className="font-mono text-[13px] leading-[1.7]">
                <code>
                  {CODE.map((line, i) => (
                    <div key={i} className="flex">
                      <span
                        aria-hidden="true"
                        className="mr-4 w-4 shrink-0 select-none text-right text-ink-subtle/60"
                      >
                        {i + 1}
                      </span>
                      <span className="text-ink">
                        {line.length === 0 ? (
                          " "
                        ) : (
                          line.map((part, j) => (
                            <span
                              key={j}
                              className={part.tone ? TONE[part.tone] : undefined}
                            >
                              {part.text}
                            </span>
                          ))
                        )}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* Terminal */}
            <div className="border-t border-edge bg-term-bg">
              <div className="flex items-center gap-3 border-b border-edge px-4 py-1.5">
                <span className="label text-[9px] text-ink">Terminal</span>
                <span className="label text-[9px] text-ink-subtle">Ports</span>
              </div>

              <div className="px-4 py-3 font-mono text-[13px] leading-[1.7]">
                <div className="flex">
                  <span className="mr-2 text-term-accent" aria-hidden="true">
                    $
                  </span>
                  <span className="text-term-ink">
                    {shown}
                    {!finished && (
                      <span
                        aria-hidden="true"
                        className="terminal-caret ml-px inline-block h-[1.1em] w-[0.5em] translate-y-[0.15em] bg-term-ink"
                      />
                    )}
                  </span>
                </div>

                {finished && (
                  <div className="animate-fade-in text-ink-muted">
                    <div>
                      <span className="text-brand">▲</span> ready in 412ms
                    </div>
                    <div>
                      <span className="text-ink-subtle">➜</span> local{"   "}
                      <span className="text-ink">http://localhost:3000</span>
                    </div>
                    <div>
                      <span className="text-ink-subtle">➜</span> public{"  "}
                      <span className="text-ink">
                        https://a7f2.repl.devx.parthkapoor.me
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status bar, matching components/sandbox/chrome.tsx. */}
        <div className="flex h-6 items-center gap-4 border-t border-edge bg-surface px-3 font-mono text-[11px] leading-none text-ink-subtle">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full bg-term-accent"
              aria-hidden="true"
            />
            connected
          </span>
          <span className="hidden sm:inline">src/index.ts</span>
          <span className="ml-auto hidden sm:inline">TypeScript</span>
          <span>UTF-8</span>
          <span className="text-brand">:3000</span>
        </div>
      </div>
    </div>
  );
}
