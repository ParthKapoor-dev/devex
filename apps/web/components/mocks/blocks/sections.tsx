"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Preview from "@/components/landing/Previews";
import { VideoReveal } from "@/components/mocks/video-reveal";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

// MOCK (direction B) — sections between the hero and the stock landing blocks.

/** Mono figure label shared by the sections, echoing the hero's spec-sheet frame. */
export function FigLabel({ n, children, className }: { n: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("label flex items-center gap-3 text-ink-subtle", className)}>
      <span className="inline-grid size-5 place-items-center rounded-[3px] bg-brand font-mono text-[10px] text-brand-fg">
        {n}
      </span>
      {children}
    </p>
  );
}

/** The interactive product shot, tilting flat as it scrolls into place. */
export function ProductShot() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section className="relative px-4 pb-16 sm:px-6">
      <div className="mx-auto max-w-5xl text-center">
        <FigLabel n="02" className="justify-center">
          <span>The workspace</span>
        </FigLabel>
        <h2 className="mx-auto mt-5 max-w-3xl text-balance font-display text-3xl font-medium tracking-[-0.035em] text-ink sm:text-5xl">
          Editor, terminal, public URL.{" "}
          <span className="text-ink-subtle">All in the same box.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-ink-muted">
          Open files, switch tabs, type in the terminal. This is the layout you
          land in the moment a workspace is running.
        </p>
      </div>

      <div ref={ref} className="relative mx-auto mt-12 max-w-5xl [perspective:1400px]">
        <motion.div
          style={reduced ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }}
          className="relative"
        >
          {/* Amber bloom behind the frame. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -top-10 bottom-1/3 -z-10 rounded-[50%] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-brand-600)_30%,transparent)_0%,transparent_70%)] blur-2xl"
          />
          <div className="rounded-xl bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand)_55%,transparent),var(--color-edge)_35%,transparent)] p-px">
            <div className="rounded-[11px] bg-canvas/90 p-1.5 sm:p-2.5 [&>div]:mt-0">
              <Preview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const STEPS = [
  { t: "0s", title: "Sign in and pick a template", body: "GitHub or a magic link, then Node, Python or Go." },
  { t: "~2s", title: "A pod lands on the cluster", body: "A Deployment, Service and Ingress, with your files pulled from object storage." },
  { t: "live", title: "Shell, editor, and a URL", body: "A real PTY over WebSockets, and anything you bind gets a public address." },
];

/** Copy on one side, the Skiper 67 video reveal on the other. */
export function DemoSplit() {
  return (
    <section id="demo" className="scroll-mt-24 px-4 sm:px-6">
      <div className="mx-auto grid max-w-5xl items-center gap-12 border-t border-edge py-20 sm:py-28 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <FigLabel n="03">
            <span>The demo</span>
          </FigLabel>
          <h2 className="mt-5 text-balance font-display text-3xl font-medium tracking-[-0.035em] text-ink sm:text-4xl">
            Watch one go from click to shell.
          </h2>
          <ol className="mt-8 flex flex-col">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={cn("grid grid-cols-[3.5rem_1fr] gap-4 py-4", i > 0 && "border-t border-edge")}
              >
                <span className="pt-0.5 font-mono text-xs tabular-nums text-brand">{s.t}</span>
                <div>
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="relative">
          {/* Offset block shadow — a nod to the cubes above. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 translate-x-3 translate-y-3 rounded-xl border border-brand/40 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-brand)_14%,transparent)_0_1px,transparent_1px_9px)] sm:translate-x-4 sm:translate-y-4"
          />
          <VideoReveal
            label="Play the DevEx demo"
            className="aspect-video w-full rounded-xl border border-edge-strong bg-surface"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://i.ytimg.com/vi/Tlck20bJeFE/maxresdefault.jpg"
              alt=""
              className="size-full object-cover opacity-70 grayscale transition-[transform,opacity,filter] duration-700 ease-[--ease-out-expo] group-hover:scale-[1.03] group-hover:opacity-100 group-hover:grayscale-0"
            />
            <span className="pointer-events-none absolute inset-0 bg-brand-700/35 mix-blend-color transition-opacity duration-500 group-hover:opacity-0" />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas/90 via-canvas/10 to-transparent" />
            <span className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-3 sm:bottom-5 sm:left-5">
              <span className="grid size-11 place-items-center rounded-md bg-brand text-brand-fg shadow-[0_8px_30px_-6px_var(--color-brand-600)] transition-transform duration-300 group-hover:scale-110">
                <svg viewBox="0 0 16 16" className="ml-0.5 size-4 fill-current" aria-hidden="true">
                  <path d="M4 2.5v11l9.5-5.5z" />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="font-display text-base font-medium text-ink">Product demo</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  hover · click to open
                </span>
              </span>
            </span>
          </VideoReveal>
        </div>
      </div>
    </section>
  );
}
