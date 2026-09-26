"use client";

import { useRef } from "react";
import { useCanvasScene, type SceneSurface } from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { bitmap } from "@/lib/wordmark";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * DEVX as a halftoned dot panel.
 *
 * The first version drew one square per cell of the 5x7 font, which is a pixel
 * font rendered in squares — legible, and completely flat. What makes a
 * dithered mark read as dithered is that it is sampled at a *higher* rate than
 * the thing it is sampling, so the edges have somewhere to break up.
 *
 * So: supersample the font by `SCALE`, bilinearly sample the 1-bit mask to get
 * real coverage at the edges, and turn coverage into dot **area** rather than
 * opacity. That is a halftone, and it is also why this is cheap — every dot in
 * a pass shares one fill style, so the whole panel is two `fill()` calls
 * instead of ~1,400 state changes.
 *
 * A sweep crosses it on a slow diagonal and the dots it passes through swell
 * and warm to amber. That is the only moving part, and it is the same gesture
 * as the CRT above it: a panel being refreshed a line at a time.
 *
 * Canvas 2D, not WebGL — the landing page runs exactly one WebGL context (the
 * hero's CRT) and AGENTS.md forbids a second below the fold. Riding
 * `useCanvasScene` also buys the offscreen pause, the tab-hidden pause, the
 * DPR cap and the reduced-motion path.
 */

/** Dots per font cell, per axis. 3 is where the edges start to read as dither. */
const SCALE = 3;
const FONT_ROWS = 7;

/** Ordered dither. Breaks the halftone up so it is not a field of even discs. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => v / 16));

const REACH = 96; // px of pointer influence
const PUSH = 15; // px of displacement at the centre of it
const REFRESH_MS = 3400; // one pass of the refresh line
/** Fraction of a cycle a dot spends lit by the line that just passed it. */
const HOT = 0.06;
/** How far a dot decays before the line comes back round. */
const DECAY = 0.7;
/** Brightness buckets. Each is one fill() — the panel is 6 draw calls total. */
const STEPS = 4;

type Cell = { gx: number; gy: number; cover: number; bayer: number };

/** Coverage at a point in font space, bilinear over the 1-bit glyph mask. */
function sample(rows: string[], x: number, y: number): number {
  const cols = rows[0].length;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const at = (cx: number, cy: number) =>
    cx < 0 || cy < 0 || cx >= cols || cy >= FONT_ROWS
      ? 0
      : rows[cy][cx] === "1"
        ? 1
        : 0;
  const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
  const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
  return top * (1 - fy) + bottom * fy;
}

function build(word: string) {
  const rows = bitmap(word);
  const cols = rows[0].length;
  const gw = cols * SCALE;
  const gh = FONT_ROWS * SCALE;
  const list: Cell[] = [];

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const cover = sample(
        rows,
        (gx + 0.5) / SCALE - 0.5,
        (gy + 0.5) / SCALE - 0.5,
      );
      // Push the midtones apart so letter interiors stay solid and only the
      // true edges land in the range where dithering is visible.
      const shaped = cover <= 0 ? 0 : Math.pow(cover, 1.15);
      list.push({ gx, gy, cover: shaped, bayer: BAYER[gy % 4][gx % 4] });
    }
  }
  return { list, gw, gh };
}

export function DotWordmark({
  word = "DEVX",
  className,
}: {
  word?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Written by pointer events, read in the frame. A ref, not state — a
  // pointermove that re-rendered React would cost more than the whole scene.
  const pointer = useRef({ x: 0, y: 0, on: false });
  const reducedMotion = useReducedMotion();

  useCanvasScene(
    canvasRef,
    () => {
      const { list, gw, gh } = build(word);
      let cellPx = 0;
      let originX = 0;
      let originY = 0;

      const layout = ({ width, height }: SceneSurface) => {
        cellPx = Math.min(width / (gw + SCALE), height / (gh + SCALE));
        originX = (width - cellPx * gw) / 2;
        originY = (height - cellPx * gh) / 2;
      };

      // Reused every frame so the loop never allocates. x, y, size per dot.
      const bucket = Array.from({ length: STEPS + 1 }, () => ({
        xs: new Float32Array(list.length * 3),
        n: 0,
      }));

      const paint = (surface: SceneSurface, intro: number, time: number) => {
        const { ctx, width, height } = surface;
        ctx.clearRect(0, 0, width, height);

        const p = pointer.current;
        const travel = width + height * 0.45;
        const head = ((time % REFRESH_MS) / REFRESH_MS) * travel;
        const max = cellPx * 0.7;

        for (const b of bucket) b.n = 0;

        for (const c of list) {
          if (c.cover < 0.04) continue;

          let x = originX + c.gx * cellPx + cellPx / 2;
          let y = originY + c.gy * cellPx + cellPx / 2;

          // Intro: the panel resolves from a scatter on first view.
          if (intro < 1) {
            const away = 1 - intro;
            x += (c.bayer - 0.5) * cellPx * 26 * away;
            y += (BAYER[(c.gy + 2) % 4][(c.gx + 1) % 4] - 0.5) * cellPx * 26 * away;
          }

          // Age since the refresh line last crossed this dot, 0 (just passed)
          // to 1 (about to be reached). This is the whole effect: the line does
          // not tint the panel, it *redraws* it, and every dot dims and drifts
          // as it waits its turn — which is what a phosphor panel actually
          // does between refreshes.
          let age = (x + y * 0.45 - head) / travel;
          age = age - Math.floor(age);

          const hot = age < HOT ? 1 - age / HOT : 0;
          const stale = Math.min(1, age / DECAY);
          // Stale dots wander off their cell a little and shrink.
          const wander = stale * cellPx * 0.16;
          x += (c.bayer - 0.5) * wander;
          y += (BAYER[(c.gx + 3) % 4][(c.gy + 2) % 4] - 0.5) * wander;

          let warm = hot;
          if (p.on) {
            const dx = x - p.x;
            const dy = y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < REACH && dist > 0.001) {
              const f = (1 - dist / REACH) ** 2;
              x += (dx / dist) * PUSH * f;
              y += (dy / dist) * PUSH * f;
              warm = Math.max(warm, f);
            }
          }

          // Coverage becomes area, so an edge dot is a smaller square rather
          // than a fainter one. The bayer term keeps the field from reading as
          // a grid of even discs.
          const size =
            max *
            Math.sqrt(c.cover) *
            (0.78 + c.bayer * 0.34) *
            (1 - stale * 0.18) *
            (1 + warm * 0.55) *
            intro;

          if (size < 0.35) continue;

          // Bucket 0 is the hot pass (amber); 1..STEPS are ink, brightest first.
          const b =
            warm > 0.28
              ? bucket[0]
              : bucket[1 + Math.min(STEPS - 1, Math.floor(stale * STEPS))];
          b.xs[b.n * 3] = x;
          b.xs[b.n * 3 + 1] = y;
          b.xs[b.n * 3 + 2] = size;
          b.n++;
        }

        const stroke = (b: { xs: Float32Array; n: number }, grow: number) => {
          ctx.beginPath();
          for (let i = 0; i < b.n; i++) {
            const size = b.xs[i * 3 + 2] * grow;
            ctx.rect(b.xs[i * 3] - size / 2, b.xs[i * 3 + 1] - size / 2, size, size);
          }
          ctx.fill();
        };

        // Ink, dimmest first so the crisp dots land on top.
        ctx.fillStyle = token.ink;
        for (let i = STEPS; i >= 1; i--) {
          if (!bucket[i].n) continue;
          ctx.globalAlpha = (0.95 - (i - 1) * 0.13) * intro;
          stroke(bucket[i], 1);
        }

        // The refresh line. Bloom under it, then the dot itself — a lit cell on
        // a dark panel spills, and without that it reads as paint.
        if (bucket[0].n) {
          ctx.fillStyle = token.brand500;
          ctx.globalAlpha = 0.14 * intro;
          stroke(bucket[0], 2.6);
          ctx.globalAlpha = intro;
          stroke(bucket[0], 1);
        }
        ctx.globalAlpha = 1;
      };

      return {
        resize: layout,
        frame(surface, time) {
          const t = Math.min(1, time / 900);
          paint(surface, 1 - Math.pow(1 - t, 3), time);
        },
        still(surface) {
          // Assembled, no sweep, no pointer response.
          pointer.current.on = false;
          paint(surface, 1, REFRESH_MS * 0.5);
        },
      };
    },
    { fps: 30, maxDpr: 2, reducedMotion },
    [word, reducedMotion],
  );

  return (
    <div
      className={cn("relative", className)}
      onPointerMove={(e) => {
        const box = e.currentTarget.getBoundingClientRect();
        pointer.current = {
          x: e.clientX - box.left,
          y: e.clientY - box.top,
          on: true,
        };
      }}
      onPointerLeave={() => {
        pointer.current.on = false;
      }}
    >
      <canvas ref={canvasRef} className="size-full" aria-hidden="true" />
      <span className="sr-only">{word}</span>
    </div>
  );
}
