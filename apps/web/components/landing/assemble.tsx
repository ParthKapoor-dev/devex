"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import type { IconType } from "react-icons";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * Scroll-assembled text and icons.
 *
 * Skiper UI "Text Scroll animation" (skiper31, https://skiper-ui.com — free
 * with attribution), rebuilt for this page:
 *
 * - `motion/react`, no Lenis, and the content is **sticky inside a tall
 *   track** so it holds still while it assembles instead of scrolling away
 *   half-built;
 * - characters are grouped into `nowrap` words, so a narrow screen wraps
 *   "NOT A / PLAYGROUND." rather than "PLAYGR / OUND.";
 * - every transform is a `useTransform` off one shared scroll value, so the
 *   whole thing is a handful of style writes per frame and no React renders;
 * - reduced motion renders it assembled and still.
 *
 * **When it plays.** Progress runs from the moment the track pins
 * (`start start`) to the moment it lets go (`end end`), and the pieces land
 * at `ASSEMBLED` of that — so the whole assembly happens while the content
 * holds still in the middle of the screen, followed by a short beat where it
 * sits finished. Before the pin you see it approaching, scattered and dim.
 * (It used to count from the track entering the viewport, which finished the
 * animation before the pin and left a long scroll past a static headline.)
 *
 * **Clicks.** Pages pull these tracks over their neighbours with negative
 * margins to hide the empty half-screens a centred sticky layer leaves. The
 * track is therefore `pointer-events-none`, or it sits invisibly over
 * the neighbour's buttons and eats their clicks — it did, on the hero's
 * "watch the demo". Anything interactive inside opts back in.
 */

const ASSEMBLED = 0.78;

function useTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  return [ref, scrollYProgress] as const;
}

export function AssembleText({
  text,
  className,
  charClassName,
  before,
  after,
}: {
  text: string;
  /** The track. Its height is how long the assembly takes to scroll. */
  className?: string;
  charClassName?: string;
  before?: React.ReactNode;
  after?: React.ReactNode;
}) {
  const [ref, progress] = useTrack();
  const reduced = useReducedMotion();
  const words = text.split(" ");
  const center = Math.floor(text.length / 2);
  let index = 0;

  return (
    <div ref={ref} className={cn("pointer-events-none relative h-[200vh]", className)}>
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-4">
        {before}
        <p aria-label={text} className="w-full text-center" style={{ perspective: "500px" }}>
          {words.map((word, w) => {
            const chars = [...word].map((c) => {
              const d = index++ - center;
              return (
                <Char key={d} char={c} d={d} progress={progress} reduced={reduced} className={charClassName} />
              );
            });
            index++; // the space
            return (
              <span key={w} className="inline-block whitespace-nowrap">
                {chars}
                {w < words.length - 1 && (
                  <span aria-hidden="true" className={cn("inline-block w-[0.28em]", charClassName)} />
                )}
              </span>
            );
          })}
        </p>
        {after}
      </div>
    </div>
  );
}

function Char({
  char,
  d,
  progress,
  reduced,
  className,
}: {
  char: string;
  d: number;
  progress: MotionValue<number>;
  reduced: boolean;
  className?: string;
}) {
  const x = useTransform(progress, [0, ASSEMBLED], [d * 50, 0]);
  const rotateX = useTransform(progress, [0, ASSEMBLED], [d * 50, 0]);
  const opacity = useTransform(progress, [0, ASSEMBLED * 0.6], [0.12, 1]);
  return (
    <motion.span
      aria-hidden="true"
      // Own layer per glyph: the glow is a 42px text-shadow, and without this
      // every scroll frame re-rasterised all of it instead of just moving it.
      className={cn("inline-block", !reduced && "will-change-transform", className)}
      style={reduced ? undefined : { x, rotateX, opacity }}
    >
      {char}
    </motion.span>
  );
}

export function AssembleIcons({
  icons,
  className,
  before,
  after,
}: {
  icons: { icon: IconType; name: string; color?: string }[];
  className?: string;
  before?: React.ReactNode;
  after?: React.ReactNode;
}) {
  const [ref, progress] = useTrack();
  const reduced = useReducedMotion();
  const center = (icons.length - 1) / 2;

  return (
    <div ref={ref} className={cn("pointer-events-none relative h-[150vh]", className)}>
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-10 overflow-hidden px-4 sm:gap-12">
        {before}
        <ul className="grid grid-cols-5 gap-3 sm:gap-4 lg:grid-cols-10">
          {icons.map((item, i) => (
            <Icon key={item.name} {...item} d={i - center} progress={progress} reduced={reduced} />
          ))}
        </ul>
        {after}
      </div>
    </div>
  );
}

function Icon({
  icon: Glyph,
  name,
  color,
  d,
  progress,
  reduced,
}: {
  icon: IconType;
  name: string;
  color?: string;
  d: number;
  progress: MotionValue<number>;
  reduced: boolean;
}) {
  const x = useTransform(progress, [0, ASSEMBLED], [d * 90, 0]);
  const y = useTransform(progress, [0, ASSEMBLED], [-Math.abs(d) * 30, 0]);
  const rotate = useTransform(progress, [0, ASSEMBLED], [d * 45, 0]);
  const scale = useTransform(progress, [0, ASSEMBLED], [0.7, 1]);
  return (
    <motion.li
      title={name}
      style={reduced ? undefined : { x, y, rotate, scale }}
      data-moving={reduced ? undefined : ""}
      className="group pointer-events-auto grid size-14 data-moving:will-change-transform place-items-center rounded-2xl border border-edge bg-surface text-ink-muted shadow-[0_10px_30px_-10px_rgb(0_0_0/0.8)] transition-colors duration-[--duration-normal] hover:border-brand/60 hover:text-ink sm:size-20"
    >
      <Glyph className="size-6 sm:size-8" style={color ? { color } : undefined} aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </motion.li>
  );
}
