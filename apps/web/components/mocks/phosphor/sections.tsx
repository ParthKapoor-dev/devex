"use client";

import Link from "next/link";
import { ScrollAssembleText } from "@/components/mocks/scroll-assemble";
import { VideoReveal } from "@/components/mocks/video-reveal";
import { cn } from "@/lib/utils";
import { DecryptText } from "./decrypt-text";
import { LOGIN_HREF } from "./boot-hero";
import s from "./phosphor.module.css";

// MOCK — direction C sections between the hero and the reused landing blocks.

/** `// comment` eyebrow — the one phosphor motif that repeats below the fold. */
export function Prompt({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs text-ink-subtle sm:text-sm", className)}>
      <span className="text-brand/70">{"// "}</span>
      {children}
    </p>
  );
}

export function NotAPlayground() {
  return (
    <ScrollAssembleText
      text="NOT A PLAYGROUND."
      eyebrow={<Prompt>most browser IDEs are a sandbox pretending</Prompt>}
      charClassName={cn(
        s.glow,
        "font-display text-[clamp(1.9rem,9vw,5.75rem)] font-semibold leading-none tracking-[-0.04em] text-brand",
      )}
    />
  );
}

const MAN = [
  {
    k: "NAME",
    v: (
      <>
        <b className="font-medium text-ink">devex</b> — a real machine, one tab away.
      </>
    ),
  },
  {
    k: "SYNOPSIS",
    v: (
      <code className="text-brand-200">
        devex start <span className="text-ink-subtle">[--template </span>
        <i className="not-italic text-brand-300">name</i>
        <span className="text-ink-subtle">]</span>
      </code>
    ),
  },
  {
    k: "ISOLATION",
    v: "Every session is its own container with its own filesystem. Nothing leaks between workspaces.",
  },
  {
    k: "SHELL",
    v: "A genuine PTY over a WebSocket — job control, signals, curses apps and your own dotfiles. Not a command runner pretending.",
  },
  {
    k: "PORTS",
    v: "Anything bound inside the container gets a public URL. Hand it to a colleague, point a webhook at it, open it on your phone.",
  },
  {
    k: "PERSISTENCE",
    v: "When a workspace sleeps, changed files go to object storage and the pod’s resources go back to the cluster. It is all still there tomorrow.",
  },
  {
    k: "SEE ALSO",
    v: (
      <span className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/docs" className="text-brand-200 underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
          docs(1)
        </Link>
        <Link href="/pricing" className="text-brand-200 underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
          pricing(7)
        </Link>
        <a
          href="https://github.com/parthkapoor-dev/devex"
          className="text-brand-200 underline decoration-brand/30 underline-offset-4 hover:decoration-brand"
        >
          source(1)
        </a>
      </span>
    ),
  },
];

/** The feature list, set as a man page. */
export function ManPage() {
  return (
    <section aria-labelledby="man-title" className="px-5 sm:px-8">
      <div className="mx-auto max-w-5xl pb-16 pt-4 sm:pb-24">
        <div className="flex items-baseline justify-between gap-4 border-b border-brand/20 pb-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle sm:text-xs">
          <span>DEVEX(1)</span>
          <span id="man-title" className="text-brand-200">
            What you actually get
          </span>
          <span className="hidden sm:inline">DEVEX(1)</span>
        </div>

        <dl className="divide-y divide-edge">
          {MAN.map((row) => (
            <div
              key={row.k}
              className="grid gap-2 py-5 sm:grid-cols-[11rem_1fr] sm:gap-8 sm:py-6"
            >
              <dt className={cn(s.glowSoft, "font-mono text-xs font-medium tracking-[0.12em] text-brand sm:pt-0.5 sm:text-[13px]")}>
                <DecryptText text={row.k} />
              </dt>
              <dd className="max-w-[62ch] text-pretty text-[15px] leading-relaxed text-ink-muted sm:text-base">
                {row.v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="flex justify-between border-t border-brand/20 pt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle sm:text-xs">
          <span>devex · open source</span>
          <span>(END)</span>
        </div>
      </div>
    </section>
  );
}

/** The demo, playing on a CRT monitor. */
export function MonitorDemo() {
  return (
    <section id="demo" aria-labelledby="demo-title" className="scroll-mt-24 px-5 sm:px-8">
      <div className="mx-auto max-w-5xl py-16 sm:py-24">
        <div className="mb-10 text-center sm:mb-14">
          <Prompt>ch.03 — the demo</Prompt>
          <h2
            id="demo-title"
            className="mt-3 text-balance font-display text-3xl font-medium leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl"
          >
            Watch one boot, <span className={cn(s.glow, "text-brand")}>edit</span>, and serve.
          </h2>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Bezel */}
          <div className={cn(s.bezel, "rounded-[20px] p-2.5 sm:rounded-[34px] sm:p-6")}>
            <div className={cn(s.glass, "relative aspect-video overflow-hidden rounded-[12px] bg-black sm:rounded-[22px]")}>
              <VideoReveal className="absolute inset-0 size-full" label="Play the DevEx demo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://i.ytimg.com/vi/Tlck20bJeFE/maxresdefault.jpg"
                  alt=""
                  className={cn(
                    s.phosphorImage,
                    "size-full scale-[1.04] object-cover transition-transform duration-700 ease-[--ease-out-expo] group-hover:scale-[1.08]",
                  )}
                />
                <span aria-hidden="true" className={cn(s.scanlines, "pointer-events-none absolute inset-0")} />
                <span aria-hidden="true" className={cn(s.glassSheen, "pointer-events-none absolute inset-0")} />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-2.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-200 sm:left-6 sm:top-5 sm:text-sm"
                >
                  <span className={s.glowSoft}>CH 03</span>
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-2.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-brand-200 sm:right-6 sm:top-5 sm:text-sm"
                >
                  <span className="terminal-caret text-danger">●</span> <span className={s.glowSoft}>REC</span>
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 grid place-items-center transition-opacity duration-[--duration-normal] group-hover:opacity-0"
                >
                  <span
                    className={cn(
                      s.glow,
                      "border border-brand/60 bg-black/40 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.2em] text-brand sm:px-5 sm:py-2.5 sm:text-base",
                    )}
                  >
                    ▶ press play
                  </span>
                </span>
              </VideoReveal>
            </div>

            {/* Chin */}
            <div aria-hidden="true" className="flex items-center justify-between px-1 pt-2.5 sm:px-2 sm:pt-5">
              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.3em] text-ink-subtle sm:text-[11px]">
                DevEx-80 <span className="hidden text-ink-subtle/60 sm:inline">· P3 phosphor</span>
              </span>
              <span className="flex items-center gap-2 sm:gap-3">
                <span className="hidden h-1.5 w-8 rounded-full bg-black/60 shadow-[inset_0_1px_1px_rgb(0_0_0/0.8)] sm:block" />
                <span className="hidden h-1.5 w-8 rounded-full bg-black/60 shadow-[inset_0_1px_1px_rgb(0_0_0/0.8)] sm:block" />
                <span className="size-1.5 rounded-full bg-brand shadow-[0_0_10px_2px_var(--color-brand)] sm:size-2" />
              </span>
            </div>
          </div>
          {/* Stand */}
          <div aria-hidden="true" className="mx-auto h-5 w-[28%] bg-gradient-to-b from-raised to-surface [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)] sm:h-10" />
          <div aria-hidden="true" className="mx-auto h-1.5 w-[42%] rounded-full bg-surface shadow-[0_20px_40px_-10px_rgb(0_0_0)] sm:h-2.5" />
        </div>
      </div>
    </section>
  );
}

/** A single `// comment` between reused sections. */
export function Interstitial({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-6">
      <Prompt className="mx-auto max-w-5xl">{children}</Prompt>
    </div>
  );
}

export function ClosingPrompt() {
  return (
    <section aria-labelledby="closing-title" className="px-5 sm:px-8">
      <div className="relative mx-auto max-w-5xl overflow-hidden border-y border-brand/20 py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_100%,color-mix(in_oklab,var(--color-brand)_14%,transparent),transparent_70%)]"
        />
        <div aria-hidden="true" className={cn(s.scanlines, "pointer-events-none absolute inset-0 opacity-40")} />
        <div className="relative text-center">
          <Prompt>exit 0</Prompt>
          <h2
            id="closing-title"
            className="mt-4 font-mono text-[clamp(1.6rem,7vw,4.5rem)] font-medium leading-none tracking-[-0.03em] text-ink"
          >
            <span className="text-ink-subtle">~ </span>
            <span className={cn(s.glow, "text-brand")}>$</span> devex start
            <span
              aria-hidden="true"
              className="terminal-caret ml-[0.1em] inline-block h-[0.85em] w-[0.5em] translate-y-[0.1em] bg-brand shadow-[0_0_24px_var(--color-brand)]"
            />
          </h2>
          <p className="mx-auto mt-6 max-w-md text-pretty leading-relaxed text-ink-muted">
            Sign in with GitHub and you are at a prompt before this page finishes
            scrolling.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={LOGIN_HREF}
              className="inline-flex h-12 items-center gap-3 rounded-sm bg-brand px-5 font-mono text-sm font-medium text-brand-fg shadow-[0_10px_40px_-10px_var(--color-brand)] transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-offset-4"
            >
              <span aria-hidden="true">↵</span> start a workspace
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-12 items-center rounded-sm border border-edge-strong px-5 font-mono text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/50 hover:text-ink"
            >
              man devex<span className="sr-only"> — read the docs</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
