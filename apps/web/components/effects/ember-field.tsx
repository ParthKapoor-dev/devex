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

/** Embers per 100,000 px² of surface. Deliberately thin. */
const DENSITY = 2.2;
const MAX = 90;

type Ember = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  span: number;
  size: number;
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
        e.y = initial ? Math.random() * height : height + Math.random() * 30;
        e.vx = (Math.random() - 0.5) * 0.14;
        e.vy = -(0.16 + Math.random() * 0.34);
        e.span = 4200 + Math.random() * 5200;
        e.life = initial ? Math.random() * e.span : 0;
        e.size = 0.9 + Math.random() * 1.7;
      };

      const layout = (surface: SceneSurface) => {
        width = surface.width;
        height = surface.height;
        const want = Math.min(
          MAX,
          Math.round(((width * height) / 100_000) * DENSITY * intensity),
        );
        embers = Array.from({ length: want }, () => {
          const e: Ember = { x: 0, y: 0, vx: 0, vy: 0, life: 0, span: 1, size: 1 };
          spawn(e, true);
          return e;
        });
      };

      const paint = ({ ctx }: SceneSurface, delta: number) => {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = token.brand500;

        for (const e of embers) {
          e.life += delta;
          if (e.life > e.span || e.y < -12) spawn(e, false);

          const t = e.life / e.span;
          e.x += e.vx * delta * 0.06;
          e.y += e.vy * delta * 0.06;
          // A slow lateral wander, so they do not rise in straight lines.
          e.x += Math.sin(e.life / 900 + e.span) * 0.06;

          // Fade in over the first fifth, then out across the rest.
          const fade = t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8;
          ctx.globalAlpha = Math.max(0, fade) * 0.55 * intensity;
          ctx.fillRect(e.x, e.y, e.size, e.size * 1.6);
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
