"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// MOCK — direction A · Molten. Poster type set on a panel of liquid chrome.

const Chrome = dynamic(() => import("./chrome"), { ssr: false });

/** ms after load; the spacing between beats is the choreography. */
const BEAT = { top: 120, line1: 220, line2: 330, aside: 520, spec: 640 } as const;

export const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function MoltenHero() {
  return (
    <section className="px-2 pb-2 pt-[4.75rem] sm:px-3 sm:pb-3">
      <div
        data-molten-hero
        className="relative isolate flex h-[calc(min(100dvh,60rem)-5.5rem)] min-h-[40rem] flex-col overflow-hidden rounded-[1.75rem] bg-canvas sm:rounded-[2.5rem]"
      >
        {/* Material */}
        <Chrome />

        {/* Legibility: heavy floor + left falloff, the metal breathes top-right. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,var(--color-canvas)_4%,color-mix(in_oklab,var(--color-canvas)_78%,transparent)_34%,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_0%_100%,color-mix(in_oklab,var(--color-canvas)_70%,transparent),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.14] mix-blend-overlay"
          style={{ backgroundImage: GRAIN }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-edge-strong"
        />

        {/* Content */}
        <div className="relative flex flex-1 flex-col p-5 sm:p-8 lg:p-12">
          {/* Top bar */}
          <div
            className="order-0 flex animate-rise items-center justify-between gap-4"
            style={{ animationDelay: `${BEAT.top}ms` }}
          >
            <p className="label inline-flex items-center gap-2 rounded-full border border-edge-strong bg-canvas/40 px-3 py-1.5 text-ink backdrop-blur-md">
              <span className="relative flex size-1.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-60" />
                <span className="relative size-1.5 rounded-full bg-brand" />
              </span>
              Open source · Kubernetes native
            </p>
            <p className="label hidden text-ink-muted sm:block">MIT · self-hostable</p>
          </div>

          {/* Aside: lead + CTAs. Top-right on desktop, under the type on mobile. */}
          <div
            className="order-3 mt-6 flex max-w-sm animate-rise lg:max-w-[26rem] flex-col gap-6 lg:order-1 lg:mt-12 lg:self-end lg:rounded-[1.5rem] lg:border lg:border-edge-strong lg:bg-canvas/55 lg:p-6 lg:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] lg:backdrop-blur-xl"
            style={{ animationDelay: `${BEAT.aside}ms` }}
          >
            <p className="text-pretty text-base leading-relaxed text-ink/85 sm:text-lg lg:text-base">
              Not a playground: a container with a real shell, a real
              filesystem, and a public URL. Up in seconds, still there
              tomorrow.
            </p>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/mocks/molten/login"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-brand pl-5 pr-2 text-sm font-medium text-brand-fg shadow-[0_10px_40px_-10px_var(--color-brand)] transition-[background-color,transform] duration-[--duration-fast] hover:bg-brand-400 active:scale-[0.98]"
              >
                Start a workspace
                <span className="grid size-8 place-items-center rounded-full bg-brand-fg text-brand transition-transform duration-300 ease-[--ease-out-expo] group-hover:translate-x-0.5 group-hover:-rotate-45">
                  <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </Link>
              <a
                href="#demo"
                className="inline-flex h-12 items-center gap-2 rounded-full border border-edge-strong bg-canvas/30 px-5 text-sm text-ink backdrop-blur-md transition-colors duration-[--duration-fast] hover:bg-canvas/60"
              >
                Watch the demo
              </a>
            </div>
          </div>

          <div className="order-1 flex-1 lg:order-2" />

          {/* Headline */}
          <h1 className="order-2 flex flex-col font-display text-[clamp(3.4rem,15.5vw,9rem)] font-medium leading-[0.9] tracking-[-0.055em] text-ink sm:text-[clamp(4rem,11vw,9rem)] lg:order-3">
            <Line delay={BEAT.line1}>
              A real <br className="sm:hidden" />
              machine,
            </Line>
            <Line delay={BEAT.line2} className="text-brand">
              one tab <br className="sm:hidden" />
              away.
            </Line>
          </h1>

          {/* Spec rail */}
          <div
            className="order-4 mt-6 flex animate-rise items-center justify-between gap-4 border-t border-edge-strong pt-4 lg:mt-10"
            style={{ animationDelay: `${BEAT.spec}ms` }}
          >
            <p className="label flex flex-wrap gap-x-3 gap-y-1 text-ink-muted">
              <span>k8s pod</span>
              <Sep />
              <span>real shell</span>
              <Sep />
              <span>public url</span>
              <Sep />
              <span>persists to s3</span>
            </p>
            <div className="hidden items-center gap-5 md:flex">
              <PointerReadout />
              <span className="label inline-flex items-center gap-1.5 text-ink-subtle">
                Scroll <ArrowDown className="size-3" aria-hidden="true" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Sep() {
  return (
    <span aria-hidden="true" className="text-brand">
      /
    </span>
  );
}

/** Live uMouse readout — the chrome reacts to the cursor, this says so. */
function PointerReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const panel = el?.closest("[data-molten-hero]");
    if (!el || !panel) return;
    const onMove = (e: PointerEvent) => {
      const r = panel.getBoundingClientRect();
      const x = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
      const y = Math.min(Math.max(1 - (e.clientY - r.top) / r.height, 0), 1);
      el.textContent = `uMouse ${x.toFixed(2)}, ${y.toFixed(2)}`;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className="label min-w-[15ch] text-right tabular-nums text-ink-subtle"
    >
      uMouse 0.62, 0.42
    </span>
  );
}

function Line({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span className="-my-[0.16em] block overflow-hidden py-[0.16em]">
      <span
        className={cn("block animate-line-rise", className)}
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </span>
    </span>
  );
}
