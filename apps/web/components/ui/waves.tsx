"use client";

import React, { useRef, type CSSProperties } from "react";
import {
  useCanvasScene,
  type Scene,
  type SceneSurface,
} from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* -------------------------------------------------------------------------- */
/* Perlin noise, specialised for a regular grid                               */
/* -------------------------------------------------------------------------- */

const PERM_SOURCE = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
  36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234,
  75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237,
  149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48,
  27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105,
  92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73,
  209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86,
  164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38,
  147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189,
  28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101,
  155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12,
  191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31,
  181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
  138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215,
  61, 156, 180,
];

const GRAD_X = new Float32Array([1, -1, 1, -1, 1, -1, 1, -1, 0, 0, 0, 0]);
const GRAD_Y = new Float32Array([1, 1, -1, -1, 0, 0, 0, 0, 1, -1, 1, -1]);

/**
 * 2D Perlin noise stored as flat typed arrays.
 *
 * The wave field is sampled on a fixed grid, so the lattice coordinates are
 * separable: everything that depends only on the column (or only on the row)
 * is hoisted out of the inner loop by the caller. That leaves four gradient
 * dot products and three lerps per point, instead of two floors and two
 * quintic fade curves on top.
 */
class GridNoise {
  private perm = new Uint8Array(512);
  private gradIndex = new Uint8Array(512);

  constructor(seed = 0) {
    if (seed > 0 && seed < 1) seed *= 65536;
    seed = Math.floor(seed);
    if (seed < 256) seed |= seed << 8;

    for (let i = 0; i < 256; i++) {
      const v =
        i & 1
          ? PERM_SOURCE[i] ^ (seed & 255)
          : PERM_SOURCE[i] ^ ((seed >> 8) & 255);
      this.perm[i] = this.perm[i + 256] = v;
      this.gradIndex[i] = this.gradIndex[i + 256] = v % 12;
    }
  }

  permAt(i: number): number {
    return this.perm[i];
  }

  /** Gradient dot product for lattice corner `i` against vector (x, y). */
  dot(i: number, x: number, y: number): number {
    const g = this.gradIndex[i];
    return GRAD_X[g] * x + GRAD_Y[g] * y;
  }
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + t * (b - a);

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export interface WavesProps {
  lineColor?: string;
  backgroundColor?: string;
  waveSpeedX?: number;
  waveSpeedY?: number;
  waveAmpX?: number;
  waveAmpY?: number;
  xGap?: number;
  yGap?: number;
  friction?: number;
  tension?: number;
  maxCursorMove?: number;
  /**
   * Pin the field to the viewport instead of the parent box. Use this for
   * page-length backdrops: the canvas stays one screen tall no matter how long
   * the page is, which keeps its memory bounded and gives a parallax feel.
   */
  fixed?: boolean;
  /** Frame rate cap. A slow field reads identically at 30fps for half the cost. */
  fps?: number;
  /** Disable cursor interaction (and its global pointer listener). */
  interactive?: boolean;
  style?: CSSProperties;
  className?: string;
}

const Waves: React.FC<WavesProps> = ({
  lineColor = "currentColor",
  backgroundColor = "transparent",
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  fixed = false,
  fps = 30,
  interactive = true,
  style,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useCanvasScene(
    canvasRef,
    () => {
      const noise = new GridNoise(Math.random());

      // Grid geometry.
      let cols = 0;
      let rows = 0;
      let originX = 0;
      let originY = 0;

      // Per-point state, flat so the hot loop stays monomorphic.
      let waveX = new Float32Array(0);
      let waveY = new Float32Array(0);
      let offX = new Float32Array(0);
      let offY = new Float32Array(0);
      let velX = new Float32Array(0);
      let velY = new Float32Array(0);

      // Per-column / per-row scratch, recomputed once per frame.
      let colLattice = new Int32Array(0);
      let colFrac = new Float32Array(0);
      let colFade = new Float32Array(0);
      let rowP0 = new Int32Array(0);
      let rowP1 = new Int32Array(0);
      let rowFrac = new Float32Array(0);
      let rowFade = new Float32Array(0);

      const pointer = {
        x: -1e5,
        y: -1e5,
        lastX: 0,
        lastY: 0,
        smoothX: -1e5,
        smoothY: -1e5,
        speed: 0,
        smoothSpeed: 0,
        angle: 0,
        engaged: false,
      };

      const onPointerMove = (event: PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        pointer.x = x;
        pointer.y = y;
        if (!pointer.engaged) {
          pointer.smoothX = pointer.lastX = x;
          pointer.smoothY = pointer.lastY = y;
          pointer.engaged = true;
        }
      };

      if (interactive && !reducedMotion) {
        // Passive: this never calls preventDefault, so it must not block scrolling.
        window.addEventListener("pointermove", onPointerMove, {
          passive: true,
        });
      }

      const buildGrid = ({ width, height }: SceneSurface) => {
        // Overscan so the field's moving edges stay off-screen.
        const spanX = width + 200;
        const spanY = height + 60;
        cols = Math.ceil(spanX / xGap) + 1;
        rows = Math.ceil(spanY / yGap) + 1;
        originX = (width - xGap * (cols - 1)) / 2;
        originY = (height - yGap * (rows - 1)) / 2;

        const total = cols * rows;
        waveX = new Float32Array(total);
        waveY = new Float32Array(total);
        offX = new Float32Array(total);
        offY = new Float32Array(total);
        velX = new Float32Array(total);
        velY = new Float32Array(total);

        colLattice = new Int32Array(cols);
        colFrac = new Float32Array(cols);
        colFade = new Float32Array(cols);
        rowP0 = new Int32Array(rows);
        rowP1 = new Int32Array(rows);
        rowFrac = new Float32Array(rows);
        rowFade = new Float32Array(rows);
      };

      const simulate = (time: number) => {
        // Hoist everything that varies only by column or only by row.
        const sx = time * waveSpeedX;
        const sy = time * waveSpeedY;

        for (let i = 0; i < cols; i++) {
          const n = (originX + xGap * i + sx) * 0.002;
          const f = Math.floor(n);
          colLattice[i] = f & 255;
          colFrac[i] = n - f;
          colFade[i] = fade(n - f);
        }
        for (let j = 0; j < rows; j++) {
          const n = (originY + yGap * j + sy) * 0.0015;
          const f = Math.floor(n);
          const y = f & 255;
          rowP0[j] = noise.permAt(y);
          rowP1[j] = noise.permAt(y + 1);
          rowFrac[j] = n - f;
          rowFade[j] = fade(n - f);
        }

        const engaged = pointer.engaged;
        const radius = Math.max(175, pointer.smoothSpeed);
        const pushX = Math.cos(pointer.angle) * radius * pointer.smoothSpeed;
        const pushY = Math.sin(pointer.angle) * radius * pointer.smoothSpeed;
        const px = pointer.smoothX;
        const py = pointer.smoothY;

        for (let i = 0; i < cols; i++) {
          const X = colLattice[i];
          const fx = colFrac[i];
          const fx1 = fx - 1;
          const u = colFade[i];
          const baseX = originX + xGap * i;

          for (let j = 0; j < rows; j++) {
            const index = i * rows + j;
            const p0 = rowP0[j];
            const p1 = rowP1[j];
            const fy = rowFrac[j];
            const fy1 = fy - 1;

            const n00 = noise.dot(X + p0, fx, fy);
            const n10 = noise.dot(X + 1 + p0, fx1, fy);
            const n01 = noise.dot(X + p1, fx, fy1);
            const n11 = noise.dot(X + 1 + p1, fx1, fy1);

            const move =
              lerp(lerp(n00, n10, u), lerp(n01, n11, u), rowFade[j]) * 12;

            waveX[index] = Math.cos(move) * waveAmpX;
            waveY[index] = Math.sin(move) * waveAmpY;

            // Cursor spring. Most points are settled and far from the pointer,
            // so skip them entirely rather than integrating zeros.
            let vx = velX[index];
            let vy = velY[index];
            let ox = offX[index];
            let oy = offY[index];

            let inRange = false;
            if (engaged) {
              const dx = baseX - px;
              const dy = originY + yGap * j - py;
              const distSq = dx * dx + dy * dy;
              if (distSq < radius * radius) {
                const dist = Math.sqrt(distSq);
                const s = 1 - dist / radius;
                const f = Math.cos(dist * 0.001) * s;
                vx += pushX * f * 0.00065;
                vy += pushY * f * 0.00065;
                inRange = true;
              }
            }

            if (
              !inRange &&
              vx === 0 &&
              vy === 0 &&
              ox === 0 &&
              oy === 0
            ) {
              continue;
            }

            vx = (vx - ox * tension) * friction;
            vy = (vy - oy * tension) * friction;
            ox += vx * 2;
            oy += vy * 2;

            if (ox > maxCursorMove) ox = maxCursorMove;
            else if (ox < -maxCursorMove) ox = -maxCursorMove;
            if (oy > maxCursorMove) oy = maxCursorMove;
            else if (oy < -maxCursorMove) oy = -maxCursorMove;

            // Snap to rest so the branch above can retire the point.
            if (
              Math.abs(vx) < 1e-3 &&
              Math.abs(vy) < 1e-3 &&
              Math.abs(ox) < 1e-3 &&
              Math.abs(oy) < 1e-3
            ) {
              vx = vy = ox = oy = 0;
            }

            velX[index] = vx;
            velY[index] = vy;
            offX[index] = ox;
            offY[index] = oy;
          }
        }
      };

      // `strokeStyle` can't resolve `var()` or `currentColor`, so anything that
      // depends on the cascade is resolved off the canvas's computed style.
      let strokeColor = lineColor;
      const resolveStroke = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        strokeColor =
          lineColor === "currentColor" || lineColor.includes("var(")
            ? getComputedStyle(canvas).color
            : lineColor;
      };

      const draw = ({ ctx, width, height }: SceneSurface) => {
        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1;

        for (let i = 0; i < cols; i++) {
          const baseX = originX + xGap * i;
          for (let j = 0; j < rows; j++) {
            const index = i * rows + j;
            // The first and last point of each line stay unwarped so the
            // field's ends don't flap around outside the overscan.
            const edge = j === 0 || j === rows - 1;
            const x =
              baseX + waveX[index] + (edge ? 0 : offX[index]);
            const y =
              originY + yGap * j + waveY[index] + (edge ? 0 : offY[index]);
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      };

      return {
        resize(surface) {
          resolveStroke();
          buildGrid(surface);
        },

        frame(surface, time) {
          if (interactive) {
            const p = pointer;
            p.smoothX += (p.x - p.smoothX) * 0.1;
            p.smoothY += (p.y - p.smoothY) * 0.1;
            const dx = p.x - p.lastX;
            const dy = p.y - p.lastY;
            p.speed = Math.hypot(dx, dy);
            p.smoothSpeed += (p.speed - p.smoothSpeed) * 0.1;
            if (p.smoothSpeed > 100) p.smoothSpeed = 100;
            p.lastX = p.x;
            p.lastY = p.y;
            p.angle = Math.atan2(dy, dx);
          }

          simulate(time);
          draw(surface);
        },

        still(surface) {
          // A single frozen frame of the field — the texture without the motion.
          simulate(0);
          draw(surface);
        },

        dispose() {
          window.removeEventListener("pointermove", onPointerMove);
        },
      } satisfies Scene;
    },
    { fps, reducedMotion, maxDpr: 2 },
    [
      lineColor,
      waveSpeedX,
      waveSpeedY,
      waveAmpX,
      waveAmpY,
      xGap,
      yGap,
      friction,
      tension,
      maxCursorMove,
      interactive,
    ],
  );

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{
        position: fixed ? "fixed" : "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        backgroundColor,
        ...style,
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
    </div>
  );
};

export default Waves;
