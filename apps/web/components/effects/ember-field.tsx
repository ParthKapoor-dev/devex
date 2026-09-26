"use client";

import { useRef } from "react";
import { useCanvasScene, type SceneSurface } from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * Embers drifting up out of the dark.
 *
 * canvasui.dev's Blaze is the reference, and it is not used here: it wants a
 * second WebGL2 context, and the thing it exists for — heat-distorting live
 * interactive HTML — is gated behind a Chrome origin trial that visitors are
 * not in, so what it would actually render for them is a fire overlay.
 *
 * This is the restrained reading of it. Not flames: a page that looks like it
 * is burning is the wrong metaphor for "a real machine, one tab away". Sparse
 * amber points rising and going out, which is the one part of fire that suits
 * a dark, near-neutral page — and which the accent budget can afford, because
 * at any moment only a few dozen pixels are lit.
 *
 * Canvas 2D on the shared scene driver, so it stops when scrolled past and
 * when the tab is hidden. Particle count scales with area, so it does not
 * quietly become expensive on a wide monitor.
 */

/** Embers per 100,000 px² of surface. */
const DENSITY = 16;
const MAX = 140;
/** One in this many is a bright one that travels faster and leaves a trail. */
const SPARK = 7;

type Ember = {
  x: number;
  y: number;
  /** Where it was last frame, so a fast one can be drawn as a streak. */
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  span: number;
  size: number;
  /** Phase of this ember's own flicker, so they do not pulse in unison. */
  phase: number;
  spark: boolean;
};

export function EmberField({
  className,
  intensity = 1,
}: {
  className?: string;
  /** Scales how many embers and how bright. 1 is the tuned default. */
  intensity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useCanvasScene(
    canvasRef,
    () => {
      let embers: Ember[] = [];
      let width = 0;
      let height = 0;

      const spawn = (e: Ember, initial: boolean) => {
        e.x = Math.random() * width;
        // Rise from the bottom edge, or from anywhere on the first fill so the
        // field does not visibly "start".
        e.y = initial ? Math.random() * height : height + Math.random() * 24;
        e.px = e.x;
        e.py = e.y;
        e.spark = Math.random() * SPARK < 1;
        e.vx = (Math.random() - 0.5) * 0.18;
        e.vy = -(e.spark ? 0.5 + Math.random() * 0.55 : 0.12 + Math.random() * 0.3);
        e.span = (e.spark ? 2600 : 5200) + Math.random() * 4200;
        e.life = initial ? Math.random() * e.span : 0;
        e.size = (e.spark ? 2.1 : 1.4) + Math.random() * 1.7;
        e.phase = Math.random() * 100;
      };

      const layout = (surface: SceneSurface) => {
        width = surface.width;
        height = surface.height;
        glow = null;
        const want = Math.min(
          MAX,
          Math.round(((width * height) / 100_000) * DENSITY * intensity),
        );
        embers = Array.from({ length: want }, () => {
          const e: Ember = {
            x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0,
            life: 0, span: 1, size: 1, phase: 0, spark: false,
          };
          spawn(e, true);
          return e;
        });
      };

      let glow: CanvasGradient | null = null;

      const paint = ({ ctx }: SceneSurface, delta: number) => {
        ctx.clearRect(0, 0, width, height);

        if (!glow) {
          glow = ctx.createLinearGradient(0, height, 0, height * 0.35);
          glow.addColorStop(0, "rgba(254, 154, 0, 0.055)");
          glow.addColorStop(1, "rgba(254, 154, 0, 0)");
        }
        ctx.fillStyle = glow;
        ctx.fillRect(0, height * 0.35, width, height * 0.65);

        ctx.lineCap = "round";

        for (const e of embers) {
          e.life += delta;
          if (e.life > e.span || e.y < -16) spawn(e, false);

          e.px = e.x;
          e.py = e.y;

          const t = e.life / e.span;
          e.x += e.vx * delta * 0.06;
          e.y += e.vy * delta * 0.06;
          // Turbulence: two out-of-step waves, so they wander instead of
          // rising on rails. Cheap, and enough to read as air moving.
          e.x +=
            (Math.sin(e.life / 780 + e.phase) +
              Math.sin(e.life / 310 + e.phase * 2) * 0.45) *
            0.09;
          // Embers slow as they cool.
          e.vy *= 1 - 0.00006 * delta;

          // Fade in over the first tenth, then out across the rest.
          const fade = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
          // Flicker. Two frequencies again, so it is not a clean pulse.
          const flicker =
            0.72 +
            0.28 * Math.sin(e.life / 95 + e.phase * 6) * Math.sin(e.life / 37 + e.phase);
          const alpha = Math.max(0, fade) * flicker * (e.spark ? 0.95 : 0.62) * intensity;
          if (alpha <= 0.004) continue;

          ctx.globalAlpha = alpha;

          if (e.spark) {
            // A streak between where it was and where it is — what actually
            // makes a moving point read as travelling rather than blinking.
            ctx.strokeStyle = token.brand400;
            ctx.lineWidth = e.size * 0.85;
            ctx.beginPath();
            ctx.moveTo(e.px, e.py);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();

            // A soft head, so the brightest point is a point.
            ctx.globalAlpha = alpha * 0.4;
            ctx.fillStyle = token.brand300;
            ctx.fillRect(
              e.x - e.size * 1.4,
              e.y - e.size * 1.4,
              e.size * 2.8,
              e.size * 2.8,
            );
          } else {
            ctx.fillStyle = token.brand500;
            ctx.fillRect(e.x, e.y, e.size, e.size * 1.5);
          }
        }
        ctx.globalAlpha = 1;
      };

      return {
        resize: layout,
        frame(surface, _time, delta) {
          // Clamp the step so a backgrounded tab does not teleport the field
          // on its first frame back.
          paint(surface, Math.min(delta, 48));
        },
        still() {
          // Nothing. A still frame of drifting embers is just specks.
        },
      };
    },
    { fps: 30, maxDpr: 1.5, reducedMotion },
    [intensity, reducedMotion],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none size-full", className)}
    />
  );
}
