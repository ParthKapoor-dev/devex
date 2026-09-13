"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GitHubStarBadge from "@/components/ui/github-star";
import ProductHuntBadge from "@/components/ui/product-hunt-badge";
import { cn } from "@/lib/utils";
import { useOffscreen } from "../pause-offscreen";
import { CrtBackdrop } from "./crt-backdrop";
import s from "../landing.module.css";

/**
 * The opening: the page boots like the product does.
 *
 * A command types itself, the log prints what Core and Kubernetes actually do
 * when you start a workspace, and then the headline burns in like phosphor.
 * The log is not decoration — each line is a real step (the template copy to
 * S3, the Deployment/Service/Ingress, the pod, the PTY), so a developer who
 * reads it has already understood the architecture.
 *
 * **Zero JavaScript timers.** Every beat is a CSS animation with a delay from
 * `BEAT`/`LOG`, so the sequence costs nothing on the main thread and the
 * global reduced-motion block collapses it to its finished frame. The only
 * script is the Enter-to-start shortcut and the two badges.
 *
 * Timings in the log are illustrative but honest: the docs quote 10–20s for a
 * first boot, and the log says 14s rather than pretending it is instant.
 */

const COMMAND = "devex start --template node api";

/**
 * `d` is ms after load; `t` is how long the line sits at `[ .. ]`.
 *
 * The whole sequence lands in ~1.2s. The trick that keeps it smooth at that
 * speed is overlap: the headline starts burning in while the last two log
 * lines are still resolving, so nothing waits for anything else.
 */
const LOG = [
  { d: 400, t: 110, text: "template copied", meta: "s3://…/you/api/", took: "0.4s" },
  { d: 520, t: 130, text: "deployment · service · ingress", meta: "applied", took: "0.2s" },
  { d: 650, t: 160, text: "pod running", meta: "files restored", took: "12.8s" },
  { d: 800, t: 90, text: "pty attached", meta: "websocket", took: "0.6s" },
] as const;

const BEAT = { command: 60, ready: 900, h1: 640, h2: 740, lead: 880, cta: 980, bar: 1080 };

const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;
const dt = (ms: number, t: number) =>
  ({ "--d": `${ms}ms`, "--t": `${t}ms` }) as React.CSSProperties;

export default function Hero() {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const offscreen = useOffscreen(sectionRef);

  // Enter with nothing focused starts a workspace — the prompt on the button
  // is a promise, so keep it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (document.activeElement && document.activeElement !== document.body) return;
      router.push("/login");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <section
      ref={sectionRef}
      className={cn("relative isolate flex min-h-[100svh] flex-col overflow-hidden", offscreen && s.paused)}
    >
      <CrtBackdrop className="absolute inset-0 -z-10" brightness={0.5}>
        {/* Dark where the type sits; the shader breathes on the right. */}
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_18%_55%,var(--color-canvas)_20%,transparent_75%)] opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-canvas/80 via-canvas/30 to-transparent max-md:from-canvas/85 max-md:via-canvas/70" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-canvas to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-canvas/90 to-transparent" />
      </CrtBackdrop>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-14 pt-28 sm:px-8 sm:pt-32">
        {/* Real social proof: a live star count and the launch. */}
        <div className={cn(s.rise, "mb-8 flex flex-wrap items-center gap-3")} style={d(0)}>
          <GitHubStarBadge
            owner="parthkapoor-dev"
            repo="devex"
            size="small"
            theme="dark"
            showMetric="stars"
          />
          <ProductHuntBadge size="small" />
        </div>

        {/* Screen readers get the substance of the log in one sentence. */}
        <p className="sr-only">
          Starting a workspace copies a template to S3, applies a Kubernetes
          Deployment, Service and Ingress, restores your files into the pod and
          attaches a terminal over a WebSocket.
        </p>
        <div
          aria-hidden="true"
          className="w-full max-w-xl overflow-hidden font-mono text-[11px] leading-[1.9] text-brand-200/70 sm:text-[13px]"
        >
          <p className="whitespace-nowrap">
            <span className="text-ink-subtle">you@devex ~ </span>
            <span className="text-brand">$ </span>
            <span
              className={cn(s.typed, "text-ink")}
              style={{ ...d(BEAT.command), "--n": COMMAND.length } as React.CSSProperties}
            >
              {COMMAND}
            </span>
          </p>
          {LOG.map((l) => (
            <p
              key={l.text}
              className={cn(s.appear, "flex items-baseline gap-2 whitespace-nowrap")}
              style={d(l.d)}
            >
              <span className={s.swap}>
                <span className={cn(s.pending, "text-ink-subtle")} style={dt(l.d, l.t)}>
                  [ <span className={s.spin} /> ]
                </span>
                <span className={cn(s.done, "text-term-accent")} style={dt(l.d, l.t)}>
                  [ ok ]
                </span>
              </span>
              <span className="text-brand-100/85">{l.text}</span>
              <span className="text-ink-subtle">·</span>
              <span className="truncate text-brand-300/70">{l.meta}</span>
              <span
                className={cn(s.done, "ml-auto hidden pl-6 tabular-nums text-ink-subtle sm:inline")}
                style={dt(l.d, l.t)}
              >
                {l.took}
              </span>
            </p>
          ))}
          <p className={cn(s.appear, "whitespace-nowrap text-term-accent")} style={d(BEAT.ready)}>
            ✓ running in 14s <span className="text-ink-subtle">— editor, shell and ports are live</span>
          </p>
        </div>
        <div
          aria-hidden="true"
          className="mb-8 mt-4 h-px w-full max-w-md bg-gradient-to-r from-brand/40 to-transparent sm:mb-10"
        />

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
          DevEx is an open-source cloud IDE. Every workspace is its own Linux
          container on Kubernetes — a code editor, a real terminal and a public
          URL in your browser, with files that are still there tomorrow.
        </p>

        <div
          className={cn(s.rise, "mt-9 flex flex-wrap items-center gap-3 sm:gap-4")}
          style={d(BEAT.cta)}
        >
          <Link
            href="/login"
            className="group inline-flex h-12 items-center gap-3 rounded-sm bg-brand pl-4 pr-2 font-mono text-sm font-medium text-brand-fg shadow-[0_0_0_1px_var(--color-brand-400),0_10px_40px_-10px_var(--color-brand)] transition-[background-color,box-shadow] duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span>
              <span className="opacity-55">$</span> start a workspace
            </span>
            <kbd
              aria-hidden="true"
              className="grid h-7 min-w-7 place-items-center rounded-xs border border-brand-fg/20 bg-brand-fg/10 px-1.5 text-xs"
            >
              ↵
            </kbd>
          </Link>

          <a
            href="#demo"
            className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-brand/25 bg-canvas/50 px-4 font-mono text-sm text-brand-200 backdrop-blur-sm transition-colors duration-[--duration-fast] hover:border-brand/60 hover:text-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span aria-hidden="true" className="text-[10px] text-brand">▶</span> watch the demo
          </a>

          <p aria-hidden="true" className="hidden font-mono text-xs text-ink-subtle md:block">
            or press{" "}
            <kbd className="rounded-xs border border-edge-strong px-1.5 py-0.5 text-ink-muted">↵</kbd>{" "}
            · free, no card
          </p>
        </div>
      </div>

      {/* tmux-style status line along the bottom of the "screen". */}
      <div
        className={cn(s.rise, "relative border-t border-brand/15 bg-canvas/60 backdrop-blur-sm")}
        style={d(BEAT.bar)}
      >
        <ul className="mx-auto flex max-w-6xl items-center gap-x-6 overflow-hidden whitespace-nowrap px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle sm:px-8">
          <li className="flex items-center gap-2 text-brand">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-term-accent shadow-[0_0_8px_var(--color-term-accent)]"
            />
            <span className="bg-brand px-1.5 text-brand-fg">0:devex*</span>
          </li>
          <li>Open source · MIT</li>
          <li className="hidden sm:block">Kubernetes native</li>
          <li className="hidden md:block">Files persist to S3</li>
          <li className="hidden lg:block">Self-hostable</li>
          <li className="ml-auto hidden text-ink-muted sm:block">
            <Link href="/ping" className="hover:text-ink">
              status ↗
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}
