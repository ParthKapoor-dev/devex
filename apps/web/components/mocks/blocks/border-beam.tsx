"use client";

import { motion, type MotionStyle } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

/**
 * MOCK (direction B) — Magic UI "Border Beam" (MIT), https://magicui.design
 * Trimmed: fixed amber colours from tokens, hidden under reduced motion.
 */
export function BorderBeam({
  size = 90,
  duration = 7,
  delay = 0,
  className,
}: {
  size?: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <motion.div
        className={cn(
          "absolute aspect-square bg-gradient-to-l from-brand-300 via-brand to-transparent",
          className,
        )}
        style={{ width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)` } as MotionStyle}
        initial={{ offsetDistance: "0%" }}
        animate={{ offsetDistance: ["0%", "100%"] }}
        transition={{ repeat: Infinity, ease: "linear", duration, delay: -delay }}
      />
    </div>
  );
}
