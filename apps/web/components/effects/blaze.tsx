"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useActiveInView } from "@/hooks/use-active-in-view";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { BlazeShaderProps } from "./blaze-shader";

/**
 * Fire along the bottom edge of whatever it is placed in.
 *
 * Three fences, in the order they bite:
 *
 * - **The chunk is not fetched until the fire is nearly on screen.** The
 *   shader is a `dynamic()` import behind an observer with a screen and a
 *   half of margin, so a reader who never reaches the footer never downloads
 *   it and never pays for a GL context.
 * - **One live context at a time.** AGENTS.md budgets the landing page a
 *   single WebGL context. This is the second one to exist, but never the
 *   second one to *run*: the hero's CRT is a full screen tall and pauses the
 *   moment it leaves the viewport, and by the time the footer is within the
 *   margin above, the hero is several screens up and stopped.
 * - **It stops when nobody is looking.** `useActiveInView` is false when the
 *   footer is scrolled past or the tab is hidden, and a paused loop cancels
 *   its rAF rather than redrawing a frozen frame.
 *
 * Under reduced motion the shader never mounts and the CSS ember base below is
 * all that is left — a warm edge, holding still.
 */

const BlazeShader = dynamic(() => import("./blaze-shader"), { ssr: false });

export function Blaze({
  className,
  ...shader
}: BlazeShaderProps & { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const active = useActiveInView(ref);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none overflow-hidden", className)}
    >
      {/* The bed of coals. Always painted, so there is warmth at the bottom
          edge before the shader arrives, under reduced motion, and on a
          machine with no WebGL at all. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 78% at 50% 108%, color-mix(in oklab, var(--color-brand-500) 46%, transparent) 0%, color-mix(in oklab, var(--color-brand-600) 18%, transparent) 38%, transparent 72%)",
        }}
      />
      {near && !reduced && (
        <div className="absolute inset-0 animate-fade-in [animation-duration:1.4s]">
          <BlazeShader pause={!active} {...shader} />
        </div>
      )}
    </div>
  );
}
