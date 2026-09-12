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
 * It is deliberately the *only* animated thing below the fold: one line of
 * type-on text, which stops permanently once it finishes. The previous
 * version of this section ran three uncapped timers with no reduced-motion
 * branch and no check for whether it was on screen.
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
  [{ text: "import", tone: "kw" }, { text: " { serve } " }, { text: "from", tone: "kw" }, { text: " " }, { text: '"./server"', tone: "str" }],
  [],
  [{ text: "// one container, one session", tone: "com" }],
  [{ text: "const", tone: "kw" }, { text: " port = " }, { text: "3000", tone: "num" }],
  [],
  [{ text: "serve", tone: "fn" }, { text: "({ port }, () => {" }],
  [{ text: "  console." }, { text: "log", tone: "fn" }, { text: "(" }, { text: "`up on :${port}`", tone: "str" }, { text: ")" }],
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
    <div ref={hostRef} className="mx-auto mt-16 w-full max-w-5xl px-0">
      <div className="overflow-hidden rounded-lg border border-edge bg-surface shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_24px_60px_-20px_rgb(0_0_0/0.7)]">
        {/* Window bar */}
        <div className="flex h-9 items-center gap-2 border-b border-edge px-3">
          <span className="flex gap-1.5" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-edge-strong" />
            <span className="size-2.5 rounded-full bg-edge-strong" />
            <span className="size-2.5 rounded-full bg-edge-strong" />
          </span>
          <span className="ml-2 truncate font-mono text-xs text-ink-subtle">
            devex / api
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 font-mono text-[10px] text-brand">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
            running
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr]">
          {/* Explorer */}
          <aside className="hidden border-r border-edge py-2 sm:block">
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
                          " "
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
            <div className="border-t border-edge bg-term-bg px-4 py-3 font-mono text-[13px] leading-[1.7]">
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
    </div>
  );
}
