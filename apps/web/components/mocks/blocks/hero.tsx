"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Play } from "lucide-react";
import { token } from "@/lib/tokens";
import { BlockWordmark, bitmap } from "./block-wordmark";

// MOCK (direction B) — the hero: DEVEX in blocks over the Waves line field.

const Waves = dynamic(() => import("@/components/mocks/waves"), { ssr: false });

const COLS = bitmap("DEVEX")[0].length;
const BLOCKS = bitmap("DEVEX").join("").split("").filter((b) => b === "1").length;

export function BlocksHero() {
  const readout = useRef<HTMLSpanElement>(null);

  return (
    <section className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:px-6 sm:pt-28">
      {/* Backdrop: wave lines, vignetted to the middle, amber floor light. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_45%,#000_25%,transparent_85%)]">
          <Waves
            lineColor={`${token.ink}1c`}
            waveSpeedX={0.011}
            waveSpeedY={0.004}
            waveAmpX={36}
            waveAmpY={18}
            xGap={12}
            yGap={34}
          />
        </div>
        <div className="absolute left-1/2 top-[46%] h-[46vh] w-[min(1200px,120vw)] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-brand-700)_28%,transparent)_0%,transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-canvas" />
      </div>

      <p className="label inline-flex animate-rise items-center gap-2 rounded-full border border-edge bg-canvas/60 px-3 py-1.5 text-ink-muted backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-term-accent" aria-hidden="true" />
        Open source · Kubernetes native
      </p>

      {/* The wordmark, framed like a figure on a spec sheet. */}
      <figure className="relative mt-6 w-[min(1040px,92vw)] sm:mt-8">
        <Crop className="left-0 top-0" />
        <Crop className="right-0 top-0 rotate-90" />
        <Crop className="bottom-0 right-0 rotate-180" />
        <Crop className="bottom-0 left-0 -rotate-90" />

        <div className="flex items-center justify-between px-3 pt-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle sm:px-5 sm:pt-4 sm:text-[11px]">
          <span>fig.01 — devex</span>
          <span>
            <span className="hidden sm:inline">{COLS}×7 · </span>
            {BLOCKS} blocks
          </span>
        </div>

        <div className="hidden px-8 py-6 sm:block">
          <BlockWordmark readoutRef={readout} className="w-full" />
        </div>
        {/* Narrow screens: stack DEV / EX so the blocks stay big enough to read. */}
        <div className="flex flex-col items-center px-6 py-3 sm:hidden">
          <BlockWordmark word="DEV" readoutRef={readout} className="w-full" />
          <BlockWordmark word="EX" readoutRef={readout} entranceDelay={500} className="mt-[5.9%] w-[64.7%]" />
        </div>

        <figcaption className="flex items-center justify-between gap-4 px-3 pb-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle sm:px-5 sm:pb-4 sm:text-[11px]">
          <span ref={readout} aria-hidden="true" className="tabular-nums text-brand/80">
            c-- · r--
          </span>
          <span className="hidden sm:inline">↖ move over the letters · click to ripple</span>
          <span className="sm:hidden">tap to ripple</span>
        </figcaption>
      </figure>

      <h1
        className="mt-8 max-w-4xl animate-rise text-balance text-center font-display text-[clamp(2.1rem,5.6vw,3.9rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink sm:mt-9"
        style={{ animationDelay: "900ms" }}
      >
        <span className="sr-only">DevEx: </span>A real machine,{" "}
        <span className="text-brand">one tab away.</span>
      </h1>

      <p
        className="mx-auto mt-4 max-w-xl animate-rise text-balance text-center text-base leading-relaxed text-ink-muted sm:text-lg"
        style={{ animationDelay: "1000ms" }}
      >
        Not a playground: a container with a real shell, a real filesystem, and a
        public URL. Up in seconds, still there tomorrow.
      </p>

      <div
        className="mt-7 flex animate-rise flex-wrap items-center justify-center gap-3"
        style={{ animationDelay: "1100ms" }}
      >
        <Link
          href="/mocks/blocks/login"
          className="group relative inline-flex h-12 items-center gap-2 rounded-md bg-brand px-6 text-sm font-medium text-brand-fg shadow-[0_0_0_1px_var(--color-brand-400),0_12px_40px_-10px_var(--color-brand-600)] transition-[background-color,transform] duration-[--duration-fast] hover:bg-brand-400 active:scale-[0.98]"
        >
          Start a workspace
          <ArrowRight
            className="size-4 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
        <a
          href="#demo"
          className="inline-flex h-12 items-center gap-2 rounded-md border border-edge bg-canvas/60 px-5 text-sm text-ink-muted backdrop-blur-sm transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink"
        >
          <Play className="size-4" aria-hidden="true" />
          Watch the demo
        </a>
      </div>
    </section>
  );
}

function Crop({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute size-4 border-l border-t border-brand/60 sm:size-5 ${className}`}
    />
  );
}
