"use client";

import Waves from "@/components/ui/waves";

/**
 * The page-length backdrop for the marketing site.
 *
 * Three layers, cheapest first:
 *  1. A static CSS radial wash — carries the brand colour with zero runtime cost
 *     and is the only thing visible before hydration, so there is no flash.
 *  2. A static grid, also pure CSS.
 *  3. The animated wave field, pinned to the viewport and capped at 30fps. It
 *     pauses itself when the tab is hidden and renders a single still frame when
 *     the user prefers reduced motion.
 *
 * Everything here is decorative: `aria-hidden`, `pointer-events-none`, and
 * behind a `z-0` so it never intercepts a click.
 */
export default function SiteBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Brand wash. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% -10%, color-mix(in oklab, var(--color-brand) 14%, transparent) 0%, transparent 60%)",
        }}
      />

      {/* Grid. Two repeating-linear-gradients instead of a DOM grid: one paint,
          no nodes, and it masks out toward the edges so it doesn't box the page in. */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, var(--color-brand) 10%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--color-brand) 10%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(110% 70% at 50% 0%, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(110% 70% at 50% 0%, black 20%, transparent 75%)",
        }}
      />

      <Waves
        fixed
        fps={30}
        lineColor="currentColor"
        style={{
          color: "color-mix(in oklab, var(--color-brand) 22%, transparent)",
        }}
        waveSpeedX={0.02}
        waveSpeedY={0.01}
        waveAmpX={40}
        waveAmpY={20}
        friction={0.9}
        tension={0.01}
        maxCursorMove={120}
        xGap={14}
        yGap={40}
      />

      {/* Fade the whole field into the page background toward the bottom so
          content further down sits on flat colour. */}
      <div
        className="absolute inset-x-0 bottom-0 h-1/3"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--color-canvas))",
        }}
      />
    </div>
  );
}
