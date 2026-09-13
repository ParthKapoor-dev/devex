"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// MOCK — scramble-then-resolve on first view. A trimmed take on Aceternity's
// Encrypted Text / Magic UI Hyper Text: one rAF loop that stops for good once
// the text resolves, and nothing at all under reduced motion.

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#$%*+=<>";

export function DecryptText({
  text,
  className,
  duration = 700,
}: {
  text: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    let raf = 0;
    let last = 0;
    const scramble = (resolved: number) =>
      text
        .split("")
        .map((c, i) =>
          c === " " || i < resolved ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        )
        .join("");

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          // ~25fps is plenty for a scramble and keeps React renders cheap.
          if (now - last > 40 || p === 1) {
            last = now;
            setShown(p === 1 ? text : scramble(Math.floor(p * text.length)));
          }
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        setShown(scramble(0));
        raf = requestAnimationFrame(tick);
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [text, duration, reduced]);

  return (
    <span ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{shown}</span>
    </span>
  );
}
