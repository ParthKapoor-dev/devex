"use client";

import { useRef } from "react";
import { IconBrandNodejs, IconBrandPython } from "@tabler/icons-react";
import { Cloud, File, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./tidal.module.css";

/**
 * MOCK — bento features. Each cell carries a small, looping, product-true
 * visual; a cursor spotlight lights the cell and its hairline border.
 */

function Cell({
  className,
  index,
  title,
  body,
  children,
}: {
  className?: string;
  index: string;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group relative isolate flex min-h-[300px] flex-col overflow-hidden rounded-xl border border-edge bg-surface/60 p-6 sm:p-7",
        className,
      )}
    >
      {/* Spotlight fill + border glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-[--duration-slow] group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-brand) 9%, transparent), transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-[--duration-slow] group-hover:opacity-100"
        style={{
          padding: 1,
          background:
            "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--color-brand) 75%, transparent), transparent 70%)",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
        }}
      />

      <div className="flex flex-1 flex-col">{children}</div>

      <div className="mt-6 flex items-start gap-4 border-t border-edge pt-5">
        <span className="label mt-1 text-ink-subtle">{index}</span>
        <div>
          <h3 className="font-display text-xl font-medium tracking-[-0.02em] text-ink">
            {title}
          </h3>
          <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-muted">
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}

const TERM = [
  { p: "~/api-playground $", c: "npm install", out: false },
  { p: "", c: "added 64 packages in 3s", out: true },
  { p: "~/api-playground $", c: "npm run dev", out: false },
  { p: "", c: "▲ ready on http://localhost:3000", out: true },
];

function IdeVisual() {
  return (
    <div aria-hidden="true" className="flex flex-1 flex-col overflow-hidden rounded-lg border border-term-edge bg-term-bg font-mono text-[12px] leading-relaxed">
      <div className="flex items-center gap-2 border-b border-term-edge bg-term-chrome px-3 py-2">
        <span className="rounded-xs bg-raised px-2 py-0.5 text-term-ink">server.ts</span>
        <span className="px-2 py-0.5 text-term-muted">package.json</span>
      </div>
      <pre className="overflow-hidden px-4 py-3 text-term-muted">
        <code>
          <span className="text-ink-subtle">1 </span> <span className="text-brand-300">import</span> express <span className="text-brand-300">from</span> <span className="text-term-accent">&quot;express&quot;</span>;{"\n"}
          <span className="text-ink-subtle">2 </span>{"\n"}
          <span className="text-ink-subtle">3 </span> <span className="text-brand-300">const</span> app = <span className="text-term-ink">express</span>();{"\n"}
          <span className="text-ink-subtle">4 </span> app.<span className="text-term-ink">get</span>(<span className="text-term-accent">&quot;/&quot;</span>, (_, res) =&gt; res.<span className="text-term-ink">send</span>(<span className="text-term-accent">&quot;hello&quot;</span>));{"\n"}
          <span className="text-ink-subtle">5 </span> app.<span className="text-term-ink">listen</span>(<span className="text-brand">3000</span>);<span className={cn(styles.caret, "ml-px inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-brand")} />
        </code>
      </pre>
      <div className="flex-1 border-t border-term-edge px-4 py-3">
        {TERM.map((l, i) => (
          <p
            key={i}
            className={cn(styles.typeLine, "truncate", l.out ? "text-term-muted" : "text-term-ink")}
            style={{ animationDelay: `${i * 0.7}s` }}
          >
            {l.p && <span className="text-term-accent">{l.p} </span>}
            {l.c}
          </p>
        ))}
      </div>
      <div className="flex items-center gap-4 border-t border-term-edge bg-term-chrome px-3 py-1.5 text-[11px] text-term-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-brand" /> running
        </span>
        <span>node</span>
        <span className="hidden sm:inline">:3000 forwarded</span>
        <span className="ml-auto">UTF-8 · TypeScript</span>
      </div>
    </div>
  );
}

function PersistVisual() {
  const tree = [
    { d: 0, n: "api-playground", dir: true },
    { d: 1, n: "src", dir: true },
    { d: 2, n: "server.ts" },
    { d: 1, n: "package.json" },
    { d: 1, n: ".env.example" },
  ];
  return (
    <div aria-hidden="true" className="grid gap-5 font-mono text-xs sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <ul className="space-y-1.5 text-ink-muted">
        {tree.map((t) => (
          <li key={t.n} className="flex items-center gap-2" style={{ paddingLeft: t.d * 14 }}>
            {t.dir ? <Folder className="size-3.5 text-ink-subtle" /> : <File className="size-3.5 text-ink-subtle" />}
            {t.n}
          </li>
        ))}
      </ul>
      <div className="relative h-px w-full bg-edge-strong sm:w-20">
        <span className={cn(styles.sync, "absolute inset-0 bg-brand")} />
      </div>
      <div className="flex items-center gap-2 rounded-md border border-edge-strong bg-canvas/60 px-3 py-2 text-ink">
        <Cloud className="size-4 text-brand" /> s3 · synced
      </div>
    </div>
  );
}

function PortVisual() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center gap-3">
        <span className="rounded-md border border-edge-strong bg-canvas/60 px-2.5 py-1.5 text-ink">:3000</span>
        <div className="relative h-px flex-1 bg-edge-strong">
          <span className={cn(styles.packet, "absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_12px_2px] shadow-brand/60")} />
        </div>
        <span className="label text-ink-subtle">public</span>
      </div>
      <p className="truncate rounded-md border border-brand/30 bg-brand/8 px-3 py-2 text-brand">
        https://a7f2.repl.devx.parthkapoor.me
      </p>
      <p className={cn(styles.typeLine, "text-ink-subtle")} style={{ animationDelay: "1.2s" }}>
        GET / <span className="text-term-accent">200</span> · hello
      </p>
    </div>
  );
}

function TemplateVisual() {
  const t = [
    { n: "Node.js", d: "npm on the path", I: IconBrandNodejs },
    { n: "Python", d: "pip + virtualenv", I: IconBrandPython },
  ];
  return (
    <ul aria-hidden="true" className="space-y-2">
      {t.map(({ n, d, I }, i) => (
        <li
          key={n}
          className={cn(
            "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
            i === 0 ? "border-brand/40 bg-brand/5" : "border-edge bg-canvas/40",
          )}
        >
          <I className="size-8 rounded-sm border border-edge bg-raised p-1.5 text-ink-muted" />
          <span>
            <span className="block text-sm text-ink">{n}</span>
            <span className="block font-mono text-[11px] text-ink-subtle">{d}</span>
          </span>
          {i === 0 && <span className="label ml-auto text-brand">Selected</span>}
        </li>
      ))}
    </ul>
  );
}

function McpVisual() {
  const log = [
    { dir: "→", t: 'runCommand("npm test")', k: "call" },
    { dir: "←", t: "1 failing: expected 200, got 404", k: "err" },
    { dir: "→", t: 'writeFile("src/server.ts")', k: "call" },
    { dir: "→", t: 'runCommand("npm test")', k: "call" },
    { dir: "←", t: "4 passing (212ms)", k: "ok" },
  ];
  return (
    <div aria-hidden="true" className="rounded-lg border border-edge bg-canvas/60 p-4 font-mono text-xs leading-relaxed">
      <p className="label mb-3 text-ink-subtle">mcp · devex</p>
      {log.map((l, i) => (
        <p
          key={i}
          className={cn(
            styles.typeLine,
            "truncate",
            l.k === "call" && "text-ink-muted",
            l.k === "err" && "text-danger",
            l.k === "ok" && "text-term-accent",
          )}
          style={{ animationDelay: `${i * 0.55}s` }}
        >
          <span className="text-ink-subtle">{l.dir} </span>
          {l.t}
        </p>
      ))}
    </div>
  );
}

function SelfHostVisual() {
  return (
    <div aria-hidden="true" className="flex h-full flex-col justify-center gap-2 font-mono text-xs">
      {["Kubernetes", "Redis", "S3 bucket"].map((x, i) => (
        <div
          key={x}
          className="flex items-center justify-between rounded-md border border-edge bg-canvas/40 px-3 py-2 text-ink-muted"
          style={{ marginLeft: i * 10 }}
        >
          {x}
          <span className="size-1.5 rounded-full bg-ink-subtle" />
        </div>
      ))}
    </div>
  );
}

export function TidalBento() {
  return (
    <section className="px-5 sm:px-8 lg:px-12" aria-labelledby="tidal-bento">
      <div className="mx-auto max-w-[1440px] border-t border-edge pt-4">
        <div className="flex justify-between">
          <span className="label text-ink-muted">
            N° 04 <span className="text-ink-subtle">— Inside the box</span>
          </span>
          <span className="label text-ink-subtle">Fig. D</span>
        </div>

        <h2
          id="tidal-bento"
          className="mt-14 max-w-4xl text-balance font-display text-4xl font-medium leading-[0.98] tracking-[-0.045em] text-ink sm:text-6xl lg:mt-20 lg:text-7xl"
        >
          Everything a laptop does. <span className="text-ink-subtle">In a pod.</span>
        </h2>

        <div className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2 lg:mt-16 lg:grid-cols-12">
          <Cell
            className="md:col-span-2 lg:col-span-7 lg:row-span-2"
            index="04.1"
            title="Monaco in front, a real shell behind"
            body="The editor from VS Code, and an xterm.js terminal attached to the container's own shell. Install what you like; it is your filesystem."
          >
            <IdeVisual />
          </Cell>
          <Cell
            className="lg:col-span-5"
            index="04.2"
            title="Still there tomorrow"
            body="The workspace filesystem syncs to S3-compatible storage and is restored when it starts again."
          >
            <PersistVisual />
          </Cell>
          <Cell
            className="lg:col-span-5"
            index="04.3"
            title="A public URL per port"
            body="Start a server in the terminal and it is reachable from anywhere. No tunnel, no config."
          >
            <PortVisual />
          </Cell>
          <Cell
            className="lg:col-span-4"
            index="04.4"
            title="Start from a template"
            body="Node.js or Python, ready before you finish reading this."
          >
            <TemplateVisual />
          </Cell>
          <Cell
            className="lg:col-span-5"
            index="04.5"
            title="Agents welcome"
            body="The DevEx MCP server gives an assistant listFiles, readFile, writeFile and runCommand, so it can run what it writes."
          >
            <McpVisual />
          </Cell>
          <Cell
            className="md:col-span-2 lg:col-span-3"
            index="04.6"
            title="Or run it yourself"
            body="Open source. Bring a cluster, a Redis and a bucket."
          >
            <SelfHostVisual />
          </Cell>
        </div>
      </div>
    </section>
  );
}
