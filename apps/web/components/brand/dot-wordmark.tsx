"use client";

import { useRef } from "react";
import { useCanvasScene, type SceneSurface } from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { bitmap } from "@/lib/wordmark";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * DEVX drawn as a dot-matrix panel.
 *
 * The same idea as the loader in `components/ui/dot-matrix.tsx` — the product
 * is a terminal, so the mark is made of the cells a terminal is made of. Doing
 * both with one visual language is the point; two unrelated effects would read
 * as decoration.
 *
 * Canvas 2D, not WebGL. The landing page runs exactly one WebGL context (the
 * hero's CRT) and AGENTS.md forbids a second below the fold, so this rides
 * `useCanvasScene` instead — which also buys the offscreen pause, the
 * tab-hidden pause, the DPR cap and the reduced-motion path for free.
 *
 * **The unlit cells are drawn too.** A bitmap with only its lit cells is just
 * text; drawing the dark ones at a low alpha is what makes it read as a panel
 * that the letters are *on*, and it is where the dithered texture comes from.
 *
 * Colour is rationed the way the design language asks: at rest every dot is
 * neutral, and only the ones near the pointer warm towards amber. The accent
 * marks where you are, which is its whole job.
 */

const ROWS = 7;
const SCATTER = 26; // px a cell starts from home, before it resolves
const REACH = 74; // px of pointer influence
const PUSH = 15; // px a cell is displaced at the centre of that influence

/** Deterministic per-cell jitter — no allocation, no Math.random in a frame. */
function hash(i: number) {
  const x = Math.sin(i * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

type Cell = { col: number; row: number; lit: boolean; seed: number };

function cells(word: string): { list: Cell[]; cols: number } {
  const rows = bitmap(word);
  const cols = rows[0].length;
  const list: Cell[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      list.push({ col: c, row: r, lit: rows[r][c] === "1", seed: r * cols + c });
    }
  }
  return { list, cols };
}

export function DotWordmark({
  word = "DEVX",
  className,
}: {
  word?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  // Written by pointer events, read in the frame. A ref, not state — a
  // pointermove that re-rendered React would cost more than the whole scene.
  const pointer = useRef<{ x: number; y: number; on: boolean }>({
    x: 0,
    y: 0,
    on: false,
  });
  const reducedMotion = useReducedMotion();

  useCanvasScene(
    canvasRef,
    () => {
      const { list, cols } = cells(word);
      let cell = 0;
      let originX = 0;
      let originY = 0;

      const layout = ({ width, height }: SceneSurface) => {
        // Fit the panel to the box, leaving a cell of air around it.
        cell = Math.min(width / (cols + 2), height / (ROWS + 2));
        originX = (width - cell * cols) / 2;
        originY = (height - cell * ROWS) / 2;
      };

      const paint = (surface: SceneSurface, resolve: number, time: number) => {
        const { ctx, width, height } = surface;
        ctx.clearRect(0, 0, width, height);

        const dot = cell * 0.68;
        const p = pointer.current;

        for (const c of list) {
          const seed = hash(c.seed);
          const homeX = originX + c.col * cell + cell / 2;
          const homeY = originY + c.row * cell + cell / 2;

          // Resolve: cells fly in from a scattered start on first view.
          const away = 1 - resolve;
          let x = homeX + (seed - 0.5) * SCATTER * away * 2;
          let y = homeY + (hash(c.seed + 91) - 0.5) * SCATTER * away * 2;

          // Idle drift, so the panel breathes instead of sitting dead.
          y += Math.sin(time / 1100 + seed * 6.3) * cell * 0.05;

          // Pointer: push away, and warm towards the accent.
          let warm = 0;
          if (p.on) {
            const dx = x - p.x;
            const dy = y - p.y;
            const dist = Math.hypot(dx, dy);
            if (dist < REACH && dist > 0.001) {
              const f = 1 - dist / REACH;
              const falloff = f * f;
              x += (dx / dist) * PUSH * falloff;
              y += (dy / dist) * PUSH * falloff;
              warm = falloff;
            }
          }

          // Unlit cells are the panel the letters sit on; they stay faint.
          // The gap has to be wide — at inkMuted and 0.8 the letters read as
          // grey mush against their own panel rather than as a word.
          const base = c.lit ? 0.92 + seed * 0.08 : 0.05 + seed * 0.03;
          ctx.globalAlpha = base * resolve;
          ctx.fillStyle =
            warm > 0.02 ? token.brand500 : c.lit ? token.ink : token.inkSubtle;

          // Size carries the dither: a little per-cell variance, and a swell
          // under the pointer. Unlit cells stay small so they read as the
          // panel's off-pixels rather than as part of a letter.
          const size =
            dot * (c.lit ? 0.92 + seed * 0.16 : 0.5 + seed * 0.14) * (1 + warm * 0.7);
          ctx.fillRect(x - size / 2, y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      };

      return {
        resize: layout,
        frame(surface, time) {
          const resolve = Math.min(1, time / 850);
          paint(surface, 1 - Math.pow(1 - resolve, 3), time);
        },
        still(surface) {
          // Assembled and motionless, with no pointer response.
          pointer.current.on = false;
          paint(surface, 1, 0);
        },
      };
    },
    // 30fps: the whole scene is ~160 filled rects and nothing in it moves fast
    // enough for 60 to be distinguishable.
    { fps: 30, maxDpr: 2, reducedMotion },
    [word, reducedMotion],
  );

  return (
    <div
      ref={hostRef}
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
