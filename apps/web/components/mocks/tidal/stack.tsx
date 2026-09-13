"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { IconType } from "react-icons";
import {
  SiBun,
  SiDjango,
  SiFastapi,
  SiGo,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiRust,
  SiTypescript,
} from "react-icons/si";
import { token } from "@/lib/tokens";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * MOCK — Skiper 31 icons (copied from components/mocks/scroll-assemble and
 * reframed for Tidal: meta labels and caption live inside the sticky frame,
 * icons brighten as they land). Templates are Node and Python; the rest
 * is a shell away.
 */
const ICONS: { icon: IconType; name: string }[] = [
  { icon: SiRust, name: "Rust" },
  { icon: SiGo, name: "Go" },
  { icon: SiTypescript, name: "TypeScript" },
  { icon: SiNextdotjs, name: "Next.js" },
  { icon: SiNodedotjs, name: "Node.js" },
  { icon: SiPython, name: "Python" },
  { icon: SiFastapi, name: "FastAPI" },
  { icon: SiDjango, name: "Django" },
  { icon: SiBun, name: "Bun" },
  { icon: SiPostgresql, name: "PostgreSQL" },
];

export function TidalStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: progress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  const center = (ICONS.length - 1) / 2;
  const rule = useTransform(progress, [0.2, 0.75], [0, 1]);

  return (
    <section ref={ref} className="relative h-[190vh]" aria-labelledby="tidal-stack">
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden px-5 pt-[88px] pb-24 sm:px-8 lg:px-12">
        <div className="mx-auto flex w-full max-w-[1440px] justify-between">
          <span className="label text-ink-muted">
            N° 02 <span className="text-ink-subtle">— Stack</span>
          </span>
          <span className="label text-ink-subtle">Fig. B</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-10 sm:gap-14">
          <h2
            id="tidal-stack"
            className="text-balance text-center font-display text-[clamp(2.4rem,9vw,6.5rem)] font-medium leading-[0.95] tracking-[-0.05em] text-ink"
          >
            whatever your <span className="text-gradient-brand">stack</span>
            <br className="hidden sm:block" /> needs
          </h2>

          <ul className="grid grid-cols-5 gap-3 sm:gap-4 lg:grid-cols-10">
            {ICONS.map((item, i) => (
              <Icon key={item.name} {...item} d={i - center} progress={progress} />
            ))}
          </ul>

          <div className="flex w-full max-w-xl flex-col items-center gap-4">
            <motion.span
              aria-hidden="true"
              style={{ scaleX: rule }}
              className="h-px w-full origin-center bg-edge-strong"
            />
            <p className="max-w-md text-center text-sm leading-relaxed text-ink-muted">
              Start from the Node.js or Python template. Everything else is a
              real shell away.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Icon({
  icon: Glyph,
  name,
  d,
  progress,
}: {
  icon: IconType;
  name: string;
  d: number;
  progress: MotionValue<number>;
}) {
  const x = useTransform(progress, [0, 0.6], [d * 90, 0]);
  const y = useTransform(progress, [0, 0.6], [-Math.abs(d) * 34, 0]);
  const rotate = useTransform(progress, [0, 0.6], [d * 40, 0]);
  const scale = useTransform(progress, [0, 0.6], [0.7, 1]);
  const reduced = useReducedMotion();
  const color = useTransform(
    progress,
    [0.45, 0.65],
    [token.inkSubtle, token.ink],
  );
  return (
    <motion.li
      title={name}
      style={reduced ? undefined : { x, y, rotate, scale, color }}
      className="grid size-14 place-items-center rounded-2xl border border-edge bg-surface shadow-[0_10px_30px_-10px_rgb(0_0_0/0.8)] transition-[border-color] duration-[--duration-normal] hover:border-brand/60 sm:size-20"
    >
      <Glyph className="size-6 sm:size-8" aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </motion.li>
  );
}
