"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  Boxes,
  Check,
  CircleDot,
  Cpu,
  GitBranch,
  Play,
  Shield,
  Terminal,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

// The shader is a client-only WebGL canvas with no server output worth
// rendering; loading it lazily keeps it off the critical path.
const Plasma = dynamic(() => import("@/components/backgrounds/plasma"), {
  ssr: false,
});

/* -------------------------------------------------------------------------- */

interface Palette {
  id: string;
  name: string;
  subtitle: string;
  /** Plasma takes a hex string — it cannot parse `var()` or oklch. */
  shader: string;
  notes: string[];
}

const PALETTES: Palette[] = [
  {
    id: "violet",
    name: "Signal Violet",
    subtitle: "A new single accent",
    shader: "#7c5cff",
    notes: [
      "Violet reads as compute and infrastructure. Emerald reads as growth/success, and is the most over-used accent in dev tools right now.",
      "Sits far from the warm end of the spectrum, so terminal output — reds, ambers, greens — never collides with the brand colour.",
      "Surfaces carry a faint cool cast so the accent looks native rather than pasted on.",
    ],
  },
  {
    id: "graphite",
    name: "Graphite + Signal",
    subtitle: "Near-monochrome, one sharp accent",
    shader: "#ff9d2e",
    notes: [
      "True neutral surfaces at zero chroma. The accent appears on one thing per screen: the primary action, the live state, the selected row.",
      "The backdrop becomes the colour event, so the shader does the expressive work instead of the chrome.",
      "Amber over a cool accent — on greyscale a warm accent reads as attention rather than decoration, and stays legible at 1–2% coverage.",
    ],
  },
  {
    id: "emerald",
    name: "Emerald",
    subtitle: "Current — the control",
    shader: "#10b981",
    notes: [
      "What the site ships today, shown unchanged for comparison.",
      "Recognisable to your existing audience, which is a real asset.",
      "The green/teal/cyan drift across components is now unified into one ramp.",
    ],
  },
];

/* -------------------------------------------------------------------------- */

export function PaletteLab() {
  const [active, setActive] = React.useState(0);
  const palette = PALETTES[active];

  return (
    <div
      data-palette={palette.id}
      className="min-h-screen bg-canvas text-ink transition-colors duration-500"
    >
      {/* Switcher */}
      <div className="sticky top-0 z-50 border-b border-edge bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-4">
          <span className="mr-2 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Direction
          </span>
          {PALETTES.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={index === active}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors duration-[--duration-fast]",
                index === active
                  ? "border-brand bg-brand text-brand-fg"
                  : "border-edge text-ink-muted hover:border-edge-strong hover:text-ink",
              )}
            >
              {option.name}
            </button>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-edge">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <Plasma
            key={palette.id}
            color={palette.shader}
            speed={0.5}
            scale={1.4}
            opacity={0.55}
            renderScale={0.5}
            maxDpr={1.5}
            targetFps={30}
            iterations={44}
            mouseInteractive={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-canvas/40 to-canvas" />
        </div>

        <div className="mx-auto max-w-4xl px-6 py-28 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface/60 px-3 py-1 text-xs text-ink-muted backdrop-blur-sm">
            <CircleDot className="size-3 text-brand" aria-hidden="true" />
            {palette.subtitle}
          </span>

          <h1 className="mt-6 text-balance text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
            A real machine,
            <br />
            <span className="text-brand">one tab away.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-ink-muted">
            Containerised dev environments on Kubernetes. A real terminal, a
            real filesystem, and ports you can hit from anywhere.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-fg transition-transform duration-[--duration-fast] hover:-translate-y-0.5">
              Start a REPL
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-edge bg-surface/60 px-5 py-2.5 text-sm text-ink transition-colors duration-[--duration-fast] hover:border-edge-strong">
              <Play className="size-4" aria-hidden="true" />
              Watch demo
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-16 px-6 py-16">
        {/* Rationale */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-subtle">
            Why this direction
          </h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {palette.notes.map((note) => (
              <li
                key={note}
                className="rounded-lg border border-edge bg-surface p-4 text-sm leading-relaxed text-ink-muted"
              >
                {note}
              </li>
            ))}
          </ul>
        </section>

        {/* Ramp */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-subtle">
            Brand ramp
          </h2>
          <div className="flex overflow-hidden rounded-lg border border-edge">
            {[
              "bg-brand-50",
              "bg-brand-100",
              "bg-brand-200",
              "bg-brand-300",
              "bg-brand-400",
              "bg-brand-500",
              "bg-brand-600",
              "bg-brand-700",
              "bg-brand-800",
              "bg-brand-900",
              "bg-brand-950",
            ].map((shade) => (
              <div key={shade} className={cn("h-14 flex-1", shade)} />
            ))}
          </div>
          <div className="mt-3 flex overflow-hidden rounded-lg border border-edge">
            {["bg-canvas", "bg-surface", "bg-raised", "bg-overlay"].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex h-14 flex-1 items-center justify-center text-[11px] text-ink-subtle",
                  s,
                )}
              >
                {s.replace("bg-", "")}
              </div>
            ))}
          </div>
        </section>

        {/* Cards */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-subtle">
            Surfaces
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Zap, title: "Instant REPLs", body: "Template to running container in seconds." },
              { icon: Terminal, title: "Real terminals", body: "A PTY over WebSocket. Job control and all." },
              { icon: Shield, title: "Isolated", body: "One container per session, torn down after." },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="group rounded-xl border border-edge bg-surface p-5 transition-colors duration-[--duration-normal] hover:border-brand/40"
              >
                <Icon className="size-5 text-brand" aria-hidden="true" />
                <h3 className="mt-3 font-medium">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* IDE chrome — the surface that matters most */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-subtle">
            IDE chrome
          </h2>
          <div className="overflow-hidden rounded-xl border border-edge bg-surface">
            <div className="flex items-center gap-2 border-b border-edge px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-danger/70" />
              <span className="size-2.5 rounded-full bg-warning/70" />
              <span className="size-2.5 rounded-full bg-brand/70" />
              <span className="ml-3 font-mono text-xs text-ink-subtle">
                api / index.ts
              </span>
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2 py-0.5 text-[11px] text-brand">
                <span className="size-1.5 rounded-full bg-brand" />
                running
              </span>
            </div>
            <div className="grid grid-cols-[180px_1fr]">
              <aside className="border-r border-edge p-3 text-sm">
                {["src", "index.ts", "server.ts", "package.json"].map((f, i) => (
                  <div
                    key={f}
                    className={cn(
                      "flex items-center gap-2 rounded px-2 py-1 font-mono text-xs",
                      i === 1
                        ? "bg-brand/10 text-brand"
                        : "text-ink-muted hover:bg-raised",
                    )}
                  >
                    {i === 0 ? (
                      <Boxes className="size-3" />
                    ) : (
                      <GitBranch className="size-3 opacity-0" />
                    )}
                    {f}
                  </div>
                ))}
              </aside>
              <pre className="overflow-x-auto bg-term-bg p-4 font-mono text-[13px] leading-relaxed text-term-ink">
                <code>{`$ npm run dev

  ▲ ready in 412ms
  ➜ local:   http://localhost:3000
  ➜ public:  https://a7f2.repl.devx.sh

listening on :3000`}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* Status + buttons */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-ink-subtle">
            States
          </h2>
          <div className="flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-sm text-brand">
              <Check className="size-3.5" /> Running
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-sm text-warning">
              <Cpu className="size-3.5" /> Provisioning
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-danger/10 px-3 py-1 text-sm text-danger">
              Stopped
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-sm text-info">
              Syncing
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
