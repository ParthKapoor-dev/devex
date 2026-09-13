"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { CrtBackdrop } from "./crt-backdrop";
import s from "./phosphor.module.css";

// MOCK — direction C hero. The page "boots": a command types, the log prints
// line by line, then the headline burns in. All CSS delays, no timers.

/** MOCK: points at the mock login so the flow can be reviewed end to end. */
export const LOGIN_HREF = "/mocks/phosphor/login";

const COMMAND = "devex start --workspace api";

/** ms after load. `t` is how long the line sits at `[ .. ]`. */
const LOG = [
  { d: 700, t: 260, text: "scheduling pod", meta: "devex-7f3a", took: "612ms" },
  { d: 940, t: 380, text: "restoring /workspace from s3", meta: "2.3 GB", took: "1.1s" },
  { d: 1180, t: 180, text: "runner attached", meta: "wss", took: "38ms" },
  { d: 1380, t: 200, text: "public url", meta: "7f3a.devx.run", took: "live" },
] as const;

const BEAT = { ready: 1640, h1: 1780, h2: 1960, lead: 2200, cta: 2360, bar: 2500 };

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export function BootHero() {
  const router = useRouter();

  // Enter anywhere on the page (nothing focused) starts a workspace.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      router.push(LOGIN_HREF);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      <CrtBackdrop className="absolute inset-0 -z-10" brightness={0.5}>
        {/* Legibility: dark where the type sits, shader breathes on the right. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_18%_55%,var(--color-canvas)_20%,transparent_75%)] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/80 via-canvas/30 to-transparent max-md:from-canvas/85 max-md:via-canvas/70" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-canvas to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-canvas/90 to-transparent" />
      </CrtBackdrop>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-16 pt-28 sm:px-8 sm:pt-32">
        {/* Boot log. Screen readers get one sentence instead of the choreography. */}
        <p className="sr-only">
          DevEx boots a workspace: pod scheduled, workspace restored from S3,
          runner attached, public URL ready — in about two seconds.
        </p>
        <div
          aria-hidden="true"
          className="w-full max-w-xl overflow-hidden font-mono text-[11px] leading-[1.9] text-brand-200/70 sm:text-[13px]"
        >
          <p className="whitespace-nowrap">
            <span className="text-ink-subtle">guest@tty0</span>
            <span className="text-ink-subtle"> ~ </span>
            <span className="text-brand">$ </span>
            <span className={cn(s.typed, "text-ink")} style={{ ...d(150), "--n": COMMAND.length } as React.CSSProperties}>
              {COMMAND}
            </span>
          </p>
          {LOG.map((l) => (
            <p key={l.text} className={cn(s.appear, "flex items-baseline gap-2 whitespace-nowrap")} style={d(l.d)}>
              <span className={s.swap}>
                <span className={cn(s.pending, "text-ink-subtle")} style={{ ...d(l.d), "--t": `${l.t}ms` } as React.CSSProperties}>
                  [ <span className={s.spin} /> ]
                </span>
                <span className={cn(s.done, "text-term-accent")} style={{ ...d(l.d), "--t": `${l.t}ms` } as React.CSSProperties}>
                  [ ok ]
                </span>
              </span>
              <span className="text-brand-100/85">{l.text}</span>
              <span className="text-ink-subtle">·</span>
              <span className="truncate text-brand-300/70">{l.meta}</span>
              <span
                className={cn(s.done, "ml-auto hidden pl-6 text-ink-subtle sm:inline")}
                style={{ ...d(l.d), "--t": `${l.t}ms` } as React.CSSProperties}
              >
                {l.took}
              </span>
            </p>
          ))}
          <p className={cn(s.appear, "whitespace-nowrap text-term-accent")} style={d(BEAT.ready)}>
            ✓ ready in 2.1s <span className="text-ink-subtle">— attach with</span>{" "}
            <span className="text-ink">devex open</span>
          </p>
        </div>
        <div aria-hidden="true" className="mb-8 mt-4 h-px w-full max-w-md bg-gradient-to-r from-brand/40 to-transparent sm:mb-10" />

        <h1 className="font-display text-[clamp(2.7rem,11.5vw,7.25rem)] font-medium leading-[0.92] tracking-[-0.045em]">
          <span className={cn(s.burn, "block origin-left text-ink")} style={d(BEAT.h1)}>
            A real machine,
          </span>
          <span className={cn(s.burn, s.glow, "block origin-left text-brand")} style={d(BEAT.h2)}>
            one tab away.
            <span
              aria-hidden="true"
              className="terminal-caret ml-[0.08em] inline-block h-[0.78em] w-[0.42em] translate-y-[0.06em] bg-brand shadow-[0_0_24px_var(--color-brand)]"
            />
          </span>
        </h1>

        <p
          className={cn(s.rise, "mt-7 max-w-xl text-pretty text-base leading-relaxed text-ink-muted sm:text-lg")}
          style={d(BEAT.lead)}
        >
          Not a playground: a container with a real shell, a real filesystem,
          and a public URL. Up in seconds, still there tomorrow.
        </p>

        <div className={cn(s.rise, "mt-9 flex flex-wrap items-center gap-3 sm:gap-4")} style={d(BEAT.cta)}>
          <Link
            href={LOGIN_HREF}
            className="group inline-flex h-12 items-center gap-3 rounded-sm bg-brand pl-4 pr-2 font-mono text-sm font-medium text-brand-fg shadow-[0_0_0_1px_var(--color-brand-400),0_10px_40px_-10px_var(--color-brand)] transition-[background-color,box-shadow] duration-[--duration-fast] hover:bg-brand-400 hover:shadow-[0_0_0_1px_var(--color-brand-300),0_10px_50px_-6px_var(--color-brand)] focus-visible:outline-offset-4"
          >
            <span>
              <span className="opacity-55">$</span> devex start
            </span>
            <kbd
              aria-hidden="true"
              className="grid h-7 min-w-7 place-items-center rounded-xs border border-brand-fg/20 bg-brand-fg/10 px-1.5 text-xs"
            >
              ↵
            </kbd>
            <span className="sr-only">— start a workspace</span>
          </Link>

          <a
            href="#demo"
            className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-brand/25 bg-canvas/50 px-4 font-mono text-sm text-brand-200 backdrop-blur-sm transition-colors duration-[--duration-fast] hover:border-brand/60 hover:text-brand-100"
          >
            <span aria-hidden="true" className="text-[10px] text-brand">▶</span> play demo
          </a>

          <p aria-hidden="true" className="hidden font-mono text-xs text-ink-subtle md:block">
            or press <kbd className="rounded-xs border border-edge-strong px-1.5 py-0.5 text-ink-muted">↵</kbd> to boot
          </p>
        </div>
      </div>

      {/* tmux-style status bar along the bottom of the "screen". */}
      <div
        className={cn(s.rise, "relative border-t border-brand/15 bg-canvas/60 backdrop-blur-sm")}
        style={d(BEAT.bar)}
      >
        <ul className="mx-auto flex max-w-6xl items-center gap-x-6 overflow-hidden whitespace-nowrap px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle sm:px-8">
          <li className="flex items-center gap-2 text-brand">
            <span className="size-1.5 rounded-full bg-term-accent shadow-[0_0_8px_var(--color-term-accent)]" aria-hidden="true" />
            <span className="bg-brand px-1.5 text-brand-fg">0:devex*</span>
          </li>
          <li>Open source</li>
          <li className="hidden sm:block">Kubernetes native</li>
          <li className="hidden md:block">Workspaces persist to S3</li>
          <li className="hidden lg:block">Runner over WebSocket</li>
          <li className="ml-auto hidden text-ink-muted sm:block">tty0 · 80×24</li>
        </ul>
      </div>
    </section>
  );
}
