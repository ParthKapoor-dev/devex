"use client";

import { useRef } from "react";
import { useCanvasScene, type SceneSurface } from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { bitmap, MARK_X, MARK_X_ASPECT } from "@/lib/wordmark";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * The logo's X over DEVX, as a halftoned dot panel.
 *
 * **How the artwork gets here.** The mark and the word are rasterised once
 * into an offscreen mask at `SS` times the dot pitch, and each dot reads its
 * coverage as a box average of the mask under it. That matters more than it
 * sounds: the browser's rasteriser antialiases the X's diagonals for free, so
 * the strokes arrive as real greyscale coverage and the edges have somewhere
 * to break up. Coverage becomes dot **area**, not opacity — an edge dot is a
 * smaller square, never a fainter one. That is what makes it a halftone rather
 * than a pixel font drawn in squares.
 *
 * **What moves.** A refresh line crosses the panel on the same diagonal as the
 * logo's `\` stroke, so when it passes it lights that whole arm at once and
 * the X appears to draw itself. It does not tint the panel, it *redraws* it:
 * every dot carries an age since the line last reached it, and dims, shrinks
 * and drifts off its cell while it waits its turn — which is what a phosphor
 * panel actually does between refreshes. Behind the line is a short amber tail
 * of dots that have not cooled back to ink yet.
 *
 * **What it costs.** Brightness is quantised into a handful of buckets and
 * each bucket is one `fill()`, so the panel is ~8 draw calls per frame rather
 * than ~5,000 state changes. Canvas 2D, not WebGL: the page's WebGL budget
 * goes to the hero's CRT and the footer's blaze. Riding `useCanvasScene` buys
 * the offscreen pause, the tab-hidden pause, the DPR cap and the
 * reduced-motion still.
 */

/** Dots across the panel. The pitch everything else is expressed in. */
const GRID_W = 72;
/** Mask pixels per dot, per axis. */
const SS = 4;
const FONT_ROWS = 7;

/** Fractions of `GRID_W`: the X's width, the word's width, the gap between. */
const MARK_W = 0.7;
const WORD_W = 0.94;
const GAP = 0.16;

/** Ordered dither. Breaks the halftone up so it is not a field of even discs. */
const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => v / 16));

const REACH = 96; // px of pointer influence
const PUSH = 15; // px of displacement at the centre of it
const REFRESH_MS = 3800; // one pass of the refresh line
/**
 * Slope of the refresh line, as dy per dx of phase. Negative, and matched to
 * the logo's `\` stroke, so the line arrives parallel to that arm.
 */
const SWEEP = -0.8;
/** Fraction of a cycle a dot spends lit by the line that just passed it. */
const HOT = 0.04;
/** ...and the longer amber tail it cools through afterwards. */
const TAIL = 0.18;
/** How far a dot decays before the line comes back round. */
const DECAY = 0.72;
/** Ink brightness buckets. Each is one fill(). */
const STEPS = 4;

type Cell = { gx: number; gy: number; cover: number; bayer: number };
type Art = { list: Cell[]; gw: number; gh: number };

/**
 * Draw the mark and the word into an offscreen mask, then box-average it down
 * to one coverage value per dot. The averaging window is one mask pixel wider
 * than a dot on every side, which softens the word's axis-aligned edges enough
 * that they dither too — without it the letters read as crisp blocks sitting
 * next to a dithered X.
 */
function build(word: string, mark: boolean): Art {
  const rows = bitmap(word);
  const cols = rows[0].length;

  const markW = mark ? GRID_W * MARK_W : 0;
  const markH = mark ? markW / MARK_X_ASPECT : 0;
  const wordW = GRID_W * WORD_W;
  const wordH = (wordW * FONT_ROWS) / cols;
  const gap = mark ? GRID_W * GAP : 0;
  const gw = GRID_W;
  const gh = Math.round(markH + gap + wordH);

  const surface = document.createElement("canvas");
  surface.width = gw * SS;
  surface.height = gh * SS;
  const m = surface.getContext("2d", { willReadFrequently: true });
  if (!m) return { list: [], gw, gh };

  m.scale(SS, SS);
  m.fillStyle = "#fff";

  if (mark) {
    const ox = (gw - markW) / 2;
    m.beginPath();
    for (const stroke of MARK_X) {
      stroke.forEach(([u, v], i) => {
        const x = ox + u * markW;
        const y = v * markH;
        if (i) m.lineTo(x, y);
        else m.moveTo(x, y);
      });
      m.closePath();
    }
    m.fill();
  }

  const cell = wordW / cols;
  const wx = (gw - wordW) / 2;
  const wy = markH + gap;
  for (let r = 0; r < FONT_ROWS; r++) {
    for (let c = 0; c < cols; c++) {
      if (rows[r][c] === "1") {
        m.fillRect(wx + c * cell, wy + r * cell, cell, cell);
      }
    }
  }

  const { data } = m.getImageData(0, 0, surface.width, surface.height);
  const stride = surface.width * 4;
  const list: Cell[] = [];

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      let sum = 0;
      let n = 0;
      for (let py = gy * SS - 1; py <= gy * SS + SS; py++) {
        if (py < 0 || py >= surface.height) continue;
        for (let px = gx * SS - 1; px <= gx * SS + SS; px++) {
          if (px < 0 || px >= surface.width) continue;
          sum += data[py * stride + px * 4 + 3];
          n++;
        }
      }
      const cover = n ? sum / (n * 255) : 0;
      if (cover < 0.04) continue;
      // Push the midtones apart so interiors stay solid and only the true
      // edges land in the range where dithering is visible.
      list.push({
        gx,
        gy,
        cover: Math.pow(cover, 1.15),
        bayer: BAYER[gy % 4][gx % 4],
      });
    }
  }

  return { list, gw, gh };
}

export function DotWordmark({
  word = "DEVX",
  mark = true,
  className,
}: {
  word?: string;
  /** Draw the logo's X above the word. */
  mark?: boolean;
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
      const { list, gw, gh } = build(word, mark);
      let cellPx = 0;
      let originX = 0;
      let originY = 0;

      const layout = ({ width, height }: SceneSurface) => {
        cellPx = Math.min(width / (gw + 1), height / (gh + 1));
        originX = (width - cellPx * gw) / 2;
        originY = (height - cellPx * gh) / 2;
      };

      // Buckets, reused every frame so the loop never allocates: 0 is the lit
      // line, 1 its cooling tail, 2.. the ink, brightest first. x, y, size.
      const bucket = Array.from({ length: STEPS + 2 }, () => ({
        xs: new Float32Array(list.length * 3),
        n: 0,
      }));

      const paint = (surface: SceneSurface, intro: number, time: number) => {
        const { ctx, width, height } = surface;
        ctx.clearRect(0, 0, width, height);

        const p = pointer.current;
        const travel = width + height * -SWEEP;
        const head = ((time % REFRESH_MS) / REFRESH_MS) * travel;
        const max = cellPx * 0.8;

        for (const b of bucket) b.n = 0;

        for (const c of list) {
          let x = originX + c.gx * cellPx + cellPx / 2;
          let y = originY + c.gy * cellPx + cellPx / 2;

          // Intro: the panel resolves from a scatter on first view.
          if (intro < 1) {
            const away = 1 - intro;
            x += (c.bayer - 0.5) * cellPx * 26 * away;
            y +=
              (BAYER[(c.gy + 2) % 4][(c.gx + 1) % 4] - 0.5) * cellPx * 26 * away;
          }

          // Age since the refresh line last crossed this dot: 0 just passed,
          // 1 about to be reached.
          let age = (x + y * SWEEP - head) / travel;
          age -= Math.floor(age);

          const hot = age < HOT ? 1 - age / HOT : 0;
          const tail = age < TAIL ? 1 - age / TAIL : 0;
          const stale = Math.min(1, age / DECAY);

          // Stale dots wander off their cell a little and shrink.
          const wander = stale * cellPx * 0.28;
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

          const size =
            max *
            Math.sqrt(c.cover) *
            (0.78 + c.bayer * 0.34) *
            (1 - stale * 0.12) *
            (1 + warm * 0.3 + tail * 0.14) *
            intro;

          if (size < 0.35) continue;

          const b =
            warm > 0.3
              ? bucket[0]
              : tail > 0.02
                ? bucket[1]
                : bucket[2 + Math.min(STEPS - 1, Math.floor(stale * STEPS))];
          b.xs[b.n * 3] = x;
          b.xs[b.n * 3 + 1] = y;
          b.xs[b.n * 3 + 2] = size;
          b.n++;
        }

        const stroke = (b: { xs: Float32Array; n: number }, grow: number) => {
          ctx.beginPath();
          for (let i = 0; i < b.n; i++) {
            const size = b.xs[i * 3 + 2] * grow;
            ctx.rect(
              b.xs[i * 3] - size / 2,
              b.xs[i * 3 + 1] - size / 2,
              size,
              size,
            );
          }
          ctx.fill();
        };

        // Ink, dimmest first so the crisp dots land on top.
        ctx.fillStyle = token.ink;
        for (let i = STEPS + 1; i >= 2; i--) {
          if (!bucket[i].n) continue;
          ctx.globalAlpha = (1 - (i - 2) * 0.1) * intro;
          stroke(bucket[i], 1);
        }

        // The tail: dots the line has already redrawn, cooling back to ink.
        // Ink first and amber over it, rather than amber alone — amber alone
        // on black is brown, and a brown tail reads as dirt, not as heat.
        if (bucket[1].n) {
          ctx.fillStyle = token.ink;
          ctx.globalAlpha = 0.55 * intro;
          stroke(bucket[1], 1);
          ctx.fillStyle = token.brand400;
          ctx.globalAlpha = 0.4 * intro;
          stroke(bucket[1], 1);
        }

        // The line itself. Bloom under it, then the dot — a lit cell on a dark
        // panel spills, and without that it reads as paint.
        if (bucket[0].n) {
          ctx.fillStyle = token.brand500;
          ctx.globalAlpha = 0.12 * intro;
          stroke(bucket[0], 2.4);
          ctx.fillStyle = token.brand300;
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
    [word, mark, reducedMotion],
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
