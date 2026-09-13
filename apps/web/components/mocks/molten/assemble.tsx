"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * MOCK — Molten's copy of `ScrollAssembleText` (Skiper UI skiper31 port,
 * https://skiper-ui.com). One change: characters are grouped into
 * `nowrap` words, so a wrap happens between words ("NOT A / PLAYGROUND.")
 * instead of mid-word. Reduced motion renders it assembled.
 */
export function AssembleText({
  text,
  className,
  charClassName,
  eyebrow,
  children,
}: {
  text: string;
  className?: string;
  charClassName?: string;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const words = text.split(" ");
  const total = text.length;
  const center = Math.floor(total / 2);
  let index = 0;

  return (
    <div ref={ref} className={cn("relative h-[160vh]", className)}>
      <div className="sticky top-0 flex h-dvh flex-col items-center justify-center gap-8 overflow-hidden px-4">
        {eyebrow}
        <p aria-label={text} className="w-full text-center" style={{ perspective: "500px" }}>
          {words.map((word, w) => {
            const chars = word.split("").map((c) => {
              const d = index++ - center;
              return <Char key={d} char={c} d={d} progress={scrollYProgress} className={charClassName} />;
            });
            index++; // the space
            return (
              <span key={w} className="inline-block whitespace-nowrap">
                {chars}
                {w < words.length - 1 && <span className={cn("inline-block w-[0.28em]", charClassName)} />}
              </span>
            );
          })}
        </p>
        {children}
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
  const opacity = useTransform(progress, [0, 0.35], [0.12, 1]);
  const reduced = useReducedMotion();
  return (
    <motion.span
      aria-hidden="true"
      className={cn("inline-block", className)}
      style={reduced ? undefined : { x, rotateX, opacity }}
    >
      {char}
    </motion.span>
  );
}
