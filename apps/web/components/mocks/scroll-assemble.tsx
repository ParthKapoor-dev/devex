"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import type { IconType } from "react-icons";
import { cn } from "@/lib/utils";

/**
 * MOCK — port of Skiper UI's "Text Scroll animation" (skiper31).
 * Free with attribution: https://skiper-ui.com
 *
 * Changes from the original: `motion/react`, no Lenis, and the content is
 * sticky inside its tall track so it holds still while it assembles instead of
 * scrolling past half-built.
 */

function useTrack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end end"],
  });
  return [ref, scrollYProgress] as const;
}

/** Characters fan out and tilt from the centre, then snap into a line. */
export function ScrollAssembleText({
  text,
  className,
  charClassName,
  eyebrow,
}: {
  text: string;
  className?: string;
  charClassName?: string;
  eyebrow?: React.ReactNode;
}) {
  const [ref, progress] = useTrack();
  const chars = text.split("");
  const center = Math.floor(chars.length / 2);

  return (
    <div ref={ref} className={cn("relative h-[180vh]", className)}>
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-6">
        {eyebrow}
        <div
          className="w-full max-w-5xl text-center"
          style={{ perspective: "500px" }}
          aria-label={text}
        >
          {chars.map((c, i) => (
            <Char
              key={i}
              char={c}
              d={i - center}
              progress={progress}
              className={charClassName}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Char({
  char,
  d,
  progress,
  className,
}: {
  char: string;
  d: number;
  progress: MotionValue<number>;
  className?: string;
}) {
  const x = useTransform(progress, [0, 0.6], [d * 50, 0]);
  const rotateX = useTransform(progress, [0, 0.6], [d * 50, 0]);
  const opacity = useTransform(progress, [0, 0.35], [0.15, 1]);
  return (
    <motion.span
      aria-hidden="true"
      className={cn("inline-block", char === " " && "w-[0.3em]", className)}
      style={{ x, rotateX, opacity }}
    >
      {char}
    </motion.span>
  );
}

/** Icons start in a fanned arc, rotated, and settle into a straight row. */
export function ScrollAssembleIcons({
  icons,
  title,
  className,
}: {
  icons: { icon: IconType; name: string }[];
  title: React.ReactNode;
  className?: string;
}) {
  const [ref, progress] = useTrack();
  const center = Math.floor(icons.length / 2);

  return (
    <div ref={ref} className={cn("relative h-[180vh]", className)}>
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-12 overflow-hidden px-6">
        <p className="flex items-center gap-3 font-display text-xl font-medium tracking-tight text-ink sm:text-2xl">
          <Bracket className="h-10 text-brand" />
          <span>{title}</span>
          <Bracket className="h-10 -scale-x-100 text-brand" />
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {icons.map((item, i) => (
            <Icon key={item.name} {...item} d={i - center} progress={progress} />
          ))}
        </ul>
      </div>
    </div>
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
  const y = useTransform(progress, [0, 0.6], [-Math.abs(d) * 30, 0]);
  const rotate = useTransform(progress, [0, 0.6], [d * 50, 0]);
  const scale = useTransform(progress, [0, 0.6], [0.7, 1]);
  return (
    <motion.li
      title={name}
      style={{ x, y, rotate, scale }}
      className="grid size-14 place-items-center rounded-2xl border border-edge bg-surface text-ink-muted shadow-[0_10px_30px_-10px_rgb(0_0_0/0.8)] sm:size-20"
    >
      <Glyph className="size-7 sm:size-9" aria-hidden="true" />
      <span className="sr-only">{name}</span>
    </motion.li>
  );
}

function Bracket({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 27 78"
      className={className}
      aria-hidden="true"
    >
      <path d="M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.760-8.38 8.380V27.6c0 4.34-2.25 8.17-5.64 10.38 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z" />
    </svg>
  );
}
