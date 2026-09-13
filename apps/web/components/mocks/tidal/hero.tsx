import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { WaveField } from "./wave-field";
import { SessionCard } from "./session-card";

/**
 * MOCK — Tidal hero. Editorial type on a 12-column grid, amber waves behind,
 * technical-drawing meta in the corners. Entrance is CSS only (line-rise/rise).
 */

const LINES: { text: string; accent?: boolean }[] = [
  { text: "A real" },
  { text: "machine,", accent: true },
  { text: "one tab" },
  { text: "away." },
];

export function TidalHero() {
  return (
    <section className="relative isolate flex min-h-[max(100dvh,760px)] flex-col overflow-hidden px-5 pt-[88px] pb-8 sm:px-8 lg:px-12">
      <WaveField />
      {/* Legibility wash behind the headline. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          background:
            "radial-gradient(60% 70% at 20% 55%, color-mix(in oklab, var(--color-canvas) 78%, transparent) 0%, transparent 70%), linear-gradient(to bottom, var(--color-canvas) 0%, transparent 18%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-1 flex-col">
        {/* Top meta rule */}
        <div className="flex animate-fade-in items-center justify-between gap-4 border-b border-edge pb-3">
          <span className="label text-ink-muted">
            N° 01 <span className="text-ink-subtle">— Workspaces</span>
          </span>
          <span className="label hidden text-ink-subtle sm:inline">
            Open source · Kubernetes native
          </span>
          <span className="label text-ink-subtle">Fig. A</span>
        </div>

        <div className="grid flex-1 grid-cols-1 items-end gap-10 py-10 lg:grid-cols-12 lg:gap-8 lg:py-12">
          <h1 className="font-display text-[clamp(3.6rem,19vw,6rem)] font-medium leading-[0.9] tracking-[-0.055em] text-ink sm:text-[clamp(5rem,11vw,9.75rem)] lg:col-span-8">
            {LINES.map((line, i) => (
              <span key={line.text} className="block overflow-hidden pb-[0.06em]">
                <span
                  className={
                    "block animate-line-rise " +
                    (line.accent ? "text-gradient-brand" : "")
                  }
                  style={{ animationDelay: `${120 + i * 90}ms` }}
                >
                  {line.text}
                </span>
              </span>
            ))}
          </h1>

          <div className="flex flex-col gap-7 lg:col-span-4 lg:border-l lg:border-edge lg:pl-8">
            <p
              className="max-w-md animate-rise text-balance text-lg leading-relaxed text-ink-muted"
              style={{ animationDelay: "520ms" }}
            >
              Not a playground: a container with a real shell, a real
              filesystem, and a public URL.{" "}
              <span className="text-ink">Up in seconds, still there tomorrow.</span>
            </p>

            <div
              className="flex animate-rise flex-wrap items-center gap-3"
              style={{ animationDelay: "600ms" }}
            >
              <Link
                href="/login"
                className="group inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 font-medium text-brand-fg transition-[filter,transform] duration-[--duration-fast] hover:brightness-110 active:scale-[0.98]"
              >
                Start a workspace
                <ArrowRight
                  className="size-4 transition-transform duration-[--duration-normal] group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <a
                href="#demo"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-edge-strong bg-canvas/40 px-4 text-ink-muted backdrop-blur-sm transition-colors duration-[--duration-fast] hover:text-ink"
              >
                <Play className="size-3.5" aria-hidden="true" />
                Watch the demo
              </a>
            </div>

            <div className="animate-rise" style={{ animationDelay: "700ms" }}>
              <SessionCard className="max-w-md" />
            </div>
          </div>
        </div>

        {/* Bottom meta rule */}
        <div className="flex items-center justify-between gap-4 border-t border-edge pt-3">
          <span className="label text-ink-subtle">Scroll ↓</span>
          <span className="label hidden text-ink-subtle md:inline">
            Monaco · xterm.js · S3 · MCP
          </span>
          <span className="label text-ink-subtle">devx.parthkapoor.me</span>
        </div>
      </div>
    </section>
  );
}
