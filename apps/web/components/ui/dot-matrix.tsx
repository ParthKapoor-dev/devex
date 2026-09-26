import { cn } from "@/lib/utils";

/**
 * The loading indicator: a 5x5 dot matrix that lights one cell at a time.
 *
 * Pure CSS — no `"use client"`, no state, no `requestAnimationFrame`. The only
 * JavaScript is the delay table below, computed once at module scope. That
 * matters for what this is: a loading state mounts constantly, often for a few
 * hundred milliseconds, and anything that has to hydrate before it can animate
 * has already missed the moment it exists for.
 *
 * It costs nothing when the tab is hidden, because the browser stops
 * compositing CSS animations on its own.
 *
 * Inherits `currentColor`, so it takes the colour of whatever it sits in
 * rather than carrying a palette of its own — 25 cells at 3px keeps the accent
 * well under the share the design language allows it.
 */

const SIZE = 5;
const CELLS = SIZE * SIZE;

/**
 * For each cell, its place in the running order. The animation is one keyframe
 * on every cell; the pattern is entirely in who goes when.
 */
function delays(pattern: Pattern): number[] {
  const order = new Array<number>(CELLS).fill(0);

  if (pattern === "spiral") {
    // Walk the ring inwards, recording the step each cell is reached on.
    let top = 0,
      bottom = SIZE - 1,
      left = 0,
      right = SIZE - 1,
      step = 0;
    while (top <= bottom && left <= right) {
      for (let c = left; c <= right; c++) order[top * SIZE + c] = step++;
      top++;
      for (let r = top; r <= bottom; r++) order[r * SIZE + right] = step++;
      right--;
      if (top <= bottom) {
        for (let c = right; c >= left; c--) order[bottom * SIZE + c] = step++;
        bottom--;
      }
      if (left <= right) {
        for (let r = bottom; r >= top; r--) order[r * SIZE + left] = step++;
        left++;
      }
    }
    return order;
  }

  if (pattern === "ripple") {
    // Distance from the middle, so it reads as a pulse rather than a rotation.
    const mid = (SIZE - 1) / 2;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        order[r * SIZE + c] = Math.round(Math.hypot(r - mid, c - mid) * 3);
      }
    }
    return order;
  }

  // "scan": a raster sweep, the way the CRT in the hero draws.
  for (let i = 0; i < CELLS; i++) order[i] = i % SIZE;
  return order;
}

type Pattern = "spiral" | "ripple" | "scan";

const ORDERS: Record<Pattern, number[]> = {
  spiral: delays("spiral"),
  ripple: delays("ripple"),
  scan: delays("scan"),
};

export function DotMatrix({
  label = "Loading",
  pattern = "spiral",
  className,
}: {
  /** Announced to screen readers. The dots themselves are decorative. */
  label?: string;
  pattern?: Pattern;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("dot-matrix", className)}
    >
      {ORDERS[pattern].map((step, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{ "--dm-i": step } as React.CSSProperties}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}
