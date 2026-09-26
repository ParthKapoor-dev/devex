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

const REACH = 82; // px of pointer influence
const PUSH = 13; // px of displacement at the centre of it
const SWEEP_MS = 5200; // one pass across the panel
const BAND = 0.055; // width of the sweep, as a fraction of the diagonal
/** Only the core of the sweep takes the accent; its shoulders just swell. */
const WARM_AT = 0.5;

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

      const paint = (surface: SceneSurface, intro: number, time: number) => {
        const { ctx, width, height } = surface;
        ctx.clearRect(0, 0, width, height);

        const p = pointer.current;
        const span = width + height * 0.45;
        const head = ((time % SWEEP_MS) / SWEEP_MS) * (span + span * BAND * 2) - span * BAND;
        const bandPx = span * BAND;
        const max = cellPx * 0.7;

        // Two passes, two fill styles: everything neutral, then everything the
        // sweep or the pointer has touched. One `fill()` each.
        ctx.beginPath();
        const warmed: [number, number, number][] = [];

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

          // The sweep, on a slow diagonal.
          const along = x + y * 0.45;
          const d = Math.abs(along - head);
          const lit = d < bandPx ? Math.pow(1 - d / bandPx, 2) : 0;

          // The pointer pushes dots aside and warms them.
          let warm = lit;
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

          // Coverage becomes area, so an edge dot is a smaller disc rather
          // than a fainter one. The bayer term keeps the field from reading
          // as a grid of even circles.
          const size =
            max *
            Math.sqrt(c.cover) *
            (0.78 + c.bayer * 0.34) *
            (1 + warm * 0.45) *
            intro;

          if (size < 0.35) continue;

          if (warm > WARM_AT) {
            warmed.push([x, y, size]);
          } else {
            ctx.rect(x - size / 2, y - size / 2, size, size);
          }
        }

        ctx.globalAlpha = 0.9 * intro;
        ctx.fillStyle = token.ink;
        ctx.fill();

        if (warmed.length) {
          ctx.beginPath();
          for (const [x, y, size] of warmed) {
            ctx.rect(x - size / 2, y - size / 2, size, size);
          }
          ctx.globalAlpha = intro;
          ctx.fillStyle = token.brand500;
          ctx.fill();
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
          paint(surface, 1, SWEEP_MS * 2);
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
