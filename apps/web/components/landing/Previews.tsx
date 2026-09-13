"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, PanelBottomClose, PanelBottomOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useActiveInView } from "@/hooks/use-active-in-view";

/**
 * The product shot under the hero — a working one.
 *
 * It was a still: a fixed tree, one file's worth of code, and a terminal line
 * that typed itself once. Which is fine as a picture and useless as a pitch,
 * because the claim being made on this page is that you get a real editor and
 * a real shell, and a picture cannot demonstrate that.
 *
 * So it is clickable. Switch files in the explorer or the tab strip, collapse
 * and reopen the terminal, flip between the terminal and the ports panel. Each
 * file carries its own terminal transcript, so changing file changes what the
 * shell has to say — which is the closest a mock can get to feeling live.
 *
 * ## The rules it still has to obey
 *
 * Everything is local state over static data: no network, no editor engine, no
 * shell. The one *timer* in the whole thing is the type-on for the terminal
 * line, and it is the same discipline as before — gated on `useActiveInView`
 * and `prefers-reduced-motion`, and it stops permanently once the line is
 * finished. Re-running it when the file changes is a deliberate exception: it
 * only runs in response to a click, so it cannot loop on its own.
 *
 * Chrome mirrors `components/sandbox/chrome.tsx` — tab strip, amber on the
 * open file only, monospace status bar. Keep them together.
 */

type Tone = "kw" | "str" | "fn" | "com" | "num" | "type";

const TONE: Record<Tone, string> = {
  kw: "text-[#c4a3ff]",
  str: "text-[#8fd4a8]",
  fn: "text-[#9cc7f0]",
  com: "text-ink-subtle italic",
  num: "text-brand-300",
  type: "text-[#9cc7f0]",
};

type Span = { text: string; tone?: Tone };

interface DemoFile {
  name: string;
  path: string;
  depth: number;
  language: string;
  code: Span[][];
  /** What running this file prints. Rendered after the command types itself. */
  command: string;
  output: { text: string; accent?: "brand" | "muted" | "ink" }[];
}

const FILES: DemoFile[] = [
  {
    name: "index.ts",
    path: "src/index.ts",
    depth: 1,
    language: "TypeScript",
    code: [
      [
        { text: "import", tone: "kw" },
        { text: " { serve } " },
        { text: "from", tone: "kw" },
        { text: " " },
        { text: '"./server"', tone: "str" },
      ],
      [],
      [{ text: "// one container, one session", tone: "com" }],
      [
        { text: "const", tone: "kw" },
        { text: " port = " },
        { text: "3000", tone: "num" },
      ],
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
    ],
    command: "npm run dev",
    output: [
      { text: "▲ ready in 412ms", accent: "brand" },
      { text: "➜ local   http://localhost:3000" },
      { text: "➜ public  https://…/a7f2/user-app/3000/" },
    ],
  },
  {
    name: "server.ts",
    path: "src/server.ts",
    depth: 1,
    language: "TypeScript",
    code: [
      [
        { text: "import", tone: "kw" },
        { text: " { createServer } " },
        { text: "from", tone: "kw" },
        { text: " " },
        { text: '"node:http"', tone: "str" },
      ],
      [],
      [
        { text: "export function", tone: "kw" },
        { text: " " },
        { text: "serve", tone: "fn" },
        { text: "(opts: " },
        { text: "Options", tone: "type" },
        { text: ", ready: () => " },
        { text: "void", tone: "kw" },
        { text: ") {" },
      ],
      [
        { text: "  " },
        { text: "return", tone: "kw" },
        { text: " " },
        { text: "createServer", tone: "fn" },
        { text: "(handler)" },
      ],
      [{ text: "    .listen(opts.port, ready)" }],
      [{ text: "}" }],
      [],
      [{ text: "// every request runs in your container", tone: "com" }],
    ],
    command: "curl -s localhost:3000/health",
    output: [
      { text: '{"status":"ok","uptime":41}', accent: "ink" },
      { text: "➜ 200 in 3ms" },
    ],
  },
  {
    name: "package.json",
    path: "package.json",
    depth: 0,
    language: "JSON",
    code: [
      [{ text: "{" }],
      [
        { text: '  "name"', tone: "type" },
        { text: ": " },
        { text: '"api"', tone: "str" },
        { text: "," },
      ],
      [
        { text: '  "scripts"', tone: "type" },
        { text: ": {" },
      ],
      [
        { text: '    "dev"', tone: "type" },
        { text: ": " },
        { text: '"tsx watch src/index.ts"', tone: "str" },
      ],
      [{ text: "  }," }],
      [
        { text: '  "engines"', tone: "type" },
        { text: ": { " },
        { text: '"node"', tone: "type" },
        { text: ": " },
        { text: '">=20"', tone: "str" },
        { text: " }" },
      ],
      [{ text: "}" }],
    ],
    command: "npm ci --omit=dev",
    output: [
      { text: "added 41 packages in 2s", accent: "ink" },
      { text: "➜ node_modules cached on the volume" },
    ],
  },
  {
    name: "Dockerfile",
    path: "Dockerfile",
    depth: 0,
    language: "Dockerfile",
    code: [
      [
        { text: "FROM", tone: "kw" },
        { text: " node:20-slim" },
      ],
      [],
      [
        { text: "WORKDIR", tone: "kw" },
        { text: " /workspaces/api" },
      ],
      [
        { text: "COPY", tone: "kw" },
        { text: " . ." },
      ],
      [
        { text: "RUN", tone: "kw" },
        { text: " npm ci" },
      ],
      [],
      [
        { text: "EXPOSE", tone: "kw" },
        { text: " " },
        { text: "3000", tone: "num" },
      ],
      [
        { text: "CMD", tone: "kw" },
        { text: " [" },
        { text: '"npm"', tone: "str" },
        { text: ", " },
        { text: '"start"', tone: "str" },
        { text: "]" },
      ],
    ],
    command: "docker build -t api .",
    output: [
      { text: "➜ this is the image your workspace runs" },
      { text: "➜ bring your own, or use a template", accent: "brand" },
    ],
  },
];

const PORTS = [
  { port: "3000", process: "node", url: "…/a7f2/user-app/3000/" },
  { port: "5432", process: "postgres", url: "private" },
];

const TREE: { name: string; depth: number; dir?: boolean; file?: string }[] = [
  { name: "src", depth: 0, dir: true },
  { name: "index.ts", depth: 1, file: "index.ts" },
  { name: "server.ts", depth: 1, file: "server.ts" },
  { name: "routes", depth: 1, dir: true },
  { name: "package.json", depth: 0, file: "package.json" },
  { name: "Dockerfile", depth: 0, file: "Dockerfile" },
];

/** Tabs open in the strip. The explorer adds to it, like a real editor. */
const INITIAL_TABS = ["index.ts", "server.ts"];

export default function Preview() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useActiveInView(hostRef);

  const [openTabs, setOpenTabs] = useState<string[]>(INITIAL_TABS);
  const [activeFile, setActiveFile] = useState("index.ts");
  const [panel, setPanel] = useState<"terminal" | "ports">("terminal");
  const [panelOpen, setPanelOpen] = useState(true);
  const [typed, setTyped] = useState(0);

  const file = FILES.find((f) => f.name === activeFile) ?? FILES[0];
  const done = typed >= file.command.length;

  // Retype whenever the open file changes — each file has its own command.
  useEffect(() => {
    setTyped(0);
  }, [activeFile]);

  useEffect(() => {
    if (reducedMotion || !inView || !panelOpen || done) return;
    const id = window.setTimeout(() => setTyped((n) => n + 1), 45);
    return () => window.clearTimeout(id);
  }, [reducedMotion, inView, panelOpen, done, typed]);

  const shown = reducedMotion ? file.command : file.command.slice(0, typed);
  const finished = reducedMotion || done;

  const openFile = (name: string) => {
    setOpenTabs((tabs) => (tabs.includes(name) ? tabs : [...tabs, name]));
    setActiveFile(name);
  };

  const closeTab = (name: string) => {
    setOpenTabs((tabs) => {
      if (tabs.length === 1) return tabs;
      const next = tabs.filter((tab) => tab !== name);
      if (name === activeFile) setActiveFile(next[next.length - 1]);
      return next;
    });
  };

  return (
    <div ref={hostRef} className="mx-auto mt-16 w-full max-w-5xl text-left">
      <div className="overflow-hidden rounded-lg border border-edge bg-surface shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_32px_80px_-24px_rgb(0_0_0/0.8)]">
        {/* Title bar */}
        <div className="flex h-9 items-center gap-3 border-b border-edge bg-surface px-3">
          <span className="truncate font-mono text-xs text-ink-muted">
            devex<span className="text-ink-subtle"> / </span>api
          </span>
          <span className="hidden rounded-xs border border-edge px-1.5 py-px font-mono text-[10px] text-ink-subtle sm:inline">
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
            {TREE.map((entry) => {
              const isOpen = entry.file === activeFile;

              if (!entry.file) {
                return (
                  <div
                    key={entry.name}
                    style={{ paddingLeft: `${entry.depth * 12 + 12}px` }}
                    className="flex items-center gap-1 py-[3px] pr-2 font-mono text-xs text-ink-subtle"
                  >
                    <ChevronRight
                      className="size-3 rotate-90"
                      aria-hidden="true"
                    />
                    {entry.name}
                  </div>
                );
              }

              return (
                <button
                  key={entry.name}
                  type="button"
                  onClick={() => openFile(entry.file!)}
                  aria-current={isOpen ? "true" : undefined}
                  style={{ paddingLeft: `${entry.depth * 12 + 12}px` }}
                  className={cn(
                    "relative flex w-full items-center py-[3px] pr-2 text-left font-mono text-xs",
                    "before:absolute before:inset-y-0 before:left-0 before:w-0.5",
                    "transition-colors duration-[--duration-fast]",
                    "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                    isOpen
                      ? "bg-raised text-ink before:bg-brand"
                      : "text-ink-subtle before:bg-transparent hover:bg-raised/60 hover:text-ink-muted",
                  )}
                >
                  {entry.name}
                </button>
              );
            })}
          </aside>

          <div className="min-w-0">
            {/* Tab strip */}
            <div className="flex h-8 items-stretch overflow-x-auto border-b border-edge bg-surface">
              {openTabs.map((tab) => {
                const isOpen = tab === activeFile;
                return (
                  <div
                    key={tab}
                    className={cn(
                      "group relative inline-flex shrink-0 items-center border-r border-edge",
                      isOpen ? "bg-term-bg" : "bg-transparent",
                    )}
                  >
                    {isOpen ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 h-px bg-brand"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveFile(tab)}
                      className={cn(
                        "py-1 pl-3 pr-1.5 font-mono text-xs transition-colors duration-[--duration-fast]",
                        "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                        isOpen
                          ? "text-ink"
                          : "text-ink-subtle hover:text-ink-muted",
                      )}
                    >
                      {tab}
                    </button>
                    <button
                      type="button"
                      onClick={() => closeTab(tab)}
                      aria-label={`Close ${tab}`}
                      className={cn(
                        "mr-1.5 grid size-4 place-items-center rounded-xs text-ink-subtle",
                        "transition-colors duration-[--duration-fast] hover:bg-raised hover:text-ink",
                        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
                        openTabs.length === 1 && "invisible",
                      )}
                    >
                      <svg viewBox="0 0 8 8" className="size-2 fill-current">
                        <path d="M1 0L0 1l3 3-3 3 1 1 3-3 3 3 1-1-3-3 3-3-1-1-3 3z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Editor */}
            <div className="overflow-x-auto bg-term-bg px-4 py-3">
              <pre className="min-h-[13.5rem] font-mono text-[13px] leading-[1.7]">
                <code>
                  {file.code.map((line, i) => (
                    <div key={i} className="flex">
                      <span
                        aria-hidden="true"
                        className="mr-4 w-4 shrink-0 select-none text-right text-ink-subtle/60"
                      >
                        {i + 1}
                      </span>
                      <span className="text-ink">
                        {line.length === 0
                          ? " "
                          : line.map((part, j) => (
                              <span
                                key={j}
                                className={part.tone ? TONE[part.tone] : undefined}
                              >
                                {part.text}
                              </span>
                            ))}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>

            {/* Bottom panel */}
            <div className="border-t border-edge bg-term-bg">
              <div className="flex items-stretch border-b border-edge">
                {(["terminal", "ports"] as const).map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setPanel(name);
                      setPanelOpen(true);
                    }}
                    className={cn(
                      "label relative px-3 py-1.5 text-[9px]",
                      "transition-colors duration-[--duration-fast]",
                      "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                      panel === name && panelOpen
                        ? "text-ink"
                        : "text-ink-subtle hover:text-ink-muted",
                    )}
                  >
                    {panel === name && panelOpen ? (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-2 bottom-0 h-px bg-brand"
                      />
                    ) : null}
                    {name}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPanelOpen((open) => !open)}
                  aria-expanded={panelOpen}
                  aria-label={panelOpen ? "Collapse panel" : "Expand panel"}
                  title={panelOpen ? "Collapse panel" : "Expand panel"}
                  className="ml-auto mr-2 grid w-6 place-items-center text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
                >
                  {panelOpen ? (
                    <PanelBottomClose className="size-3.5" />
                  ) : (
                    <PanelBottomOpen className="size-3.5" />
                  )}
                </button>
              </div>

              {panelOpen ? (
                panel === "terminal" ? (
                  <div className="min-h-[7.5rem] px-4 py-3 font-mono text-[13px] leading-[1.7]">
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
                        {file.output.map((line) => (
                          <div
                            key={line.text}
                            className={cn(
                              line.accent === "brand" && "text-brand",
                              line.accent === "ink" && "text-term-ink",
                            )}
                          >
                            {line.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="min-h-[7.5rem] px-4 py-3">
                    <div className="label mb-2 grid grid-cols-[4rem_5rem_1fr] gap-3 text-[9px] text-ink-subtle">
                      <span>Port</span>
                      <span>Process</span>
                      <span>Address</span>
                    </div>
                    {PORTS.map((entry) => (
                      <div
                        key={entry.port}
                        className="grid grid-cols-[4rem_5rem_1fr] gap-3 py-0.5 font-mono text-xs"
                      >
                        <span className="tabular-nums text-ink">
                          {entry.port}
                        </span>
                        <span className="text-ink-subtle">{entry.process}</span>
                        <span
                          className={cn(
                            "truncate",
                            entry.url === "private"
                              ? "text-ink-subtle"
                              : "text-term-ink",
                          )}
                        >
                          {entry.url}
                        </span>
                      </div>
                    ))}
                  </div>
                )
              ) : null}
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
          <span className="hidden truncate sm:inline">{file.path}</span>
          <span className="ml-auto hidden sm:inline">{file.language}</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="text-brand">:3000</span>
        </div>
      </div>

      <p className="mt-3 text-center font-mono text-[11px] text-ink-subtle">
        Not a video — click a file, or collapse the panel.
      </p>
    </div>
  );
}
