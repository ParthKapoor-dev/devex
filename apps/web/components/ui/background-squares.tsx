"use client";

import React, { useRef } from "react";
import {
  useCanvasScene,
  type Scene,
  type SceneSurface,
} from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

type CanvasStrokeStyle = string | CanvasGradient | CanvasPattern;

interface SquaresProps {
  direction?: "diagonal" | "up" | "right" | "down" | "left";
  /** Pixels per frame at 60fps. */
  speed?: number;
  borderColor?: CanvasStrokeStyle;
  squareSize?: number;
  hoverFillColor?: CanvasStrokeStyle;
  className?: string;
}

/**
 * A drifting grid of squares, used behind the auth pages.
 *
 * Runs through `useCanvasScene`, so the loop stops when the canvas is off
 * screen or the tab is hidden, and renders a single static frame when the user
 * prefers reduced motion.
 */
const Squares: React.FC<SquaresProps> = ({
  direction = "right",
  speed = 1,
  borderColor = "color-mix(in oklab, var(--color-brand) 22%, transparent)",
  squareSize = 40,
  hoverFillColor = "color-mix(in oklab, var(--color-brand) 12%, transparent)",
  className = "fixed inset-0 -z-10 h-full w-full",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useCanvasScene(
    canvasRef,
    () => {
      const offset = { x: 0, y: 0 };
      let hovered: { x: number; y: number } | null = null;

      // strokeStyle/fillStyle cannot resolve var(); read them off the element.
      let stroke = String(borderColor);
      let fill = String(hoverFillColor);
      let vignette = "rgba(10,10,10,0.92)";
      let backdrop: CanvasGradient | null = null;

      // Resolve a value that may reference the cascade by parking it on a
      // custom property and reading back the computed (absolute) colour.
      const resolveColors = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const computed = getComputedStyle(canvas);
        const read = (property: string, fallback: string) =>
          computed.getPropertyValue(property).trim() || fallback;

        stroke = read("--squares-border", String(borderColor));
        fill = read("--squares-hover", String(hoverFillColor));
        vignette = read("--squares-vignette", vignette);
      };

      const onPointerMove = (event: PointerEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        hovered = {
          x: Math.floor((x + offset.x) / squareSize),
          y: Math.floor((y + offset.y) / squareSize),
        };
      };

      const onPointerLeave = () => {
        hovered = null;
      };

      const canvas = canvasRef.current;
      if (canvas && !reducedMotion) {
        canvas.addEventListener("pointermove", onPointerMove, { passive: true });
        canvas.addEventListener("pointerleave", onPointerLeave);
      }

      const draw = ({ ctx, width, height }: SceneSurface) => {
        ctx.clearRect(0, 0, width, height);

        const startX = Math.floor(offset.x / squareSize) * squareSize;
        const startY = Math.floor(offset.y / squareSize) * squareSize;

        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1;

        // One path for every square outline: a single stroke() instead of one
        // per cell, which is the difference between ~1 and ~1500 draw calls.
        ctx.beginPath();
        for (let x = startX; x < width + squareSize; x += squareSize) {
          for (let y = startY; y < height + squareSize; y += squareSize) {
            const squareX = x - (offset.x % squareSize);
            const squareY = y - (offset.y % squareSize);
            ctx.rect(squareX, squareY, squareSize, squareSize);
          }
        }
        ctx.stroke();

        if (hovered) {
          const squareX =
            hovered.x * squareSize - (offset.x % squareSize) + startX;
          const squareY =
            hovered.y * squareSize - (offset.y % squareSize) + startY;
          ctx.fillStyle = fill;
          ctx.fillRect(squareX, squareY, squareSize, squareSize);
        }

        // Vignette. Rebuilt only on resize — createRadialGradient every frame
        // was allocating a gradient object 60 times a second.
        if (backdrop) {
          ctx.fillStyle = backdrop;
          ctx.fillRect(0, 0, width, height);
        }
      };

      return {
        resize(surface) {
          resolveColors();
          const { ctx, width, height } = surface;
          const radius = Math.hypot(width, height) / 2;
          backdrop = ctx.createRadialGradient(
            width / 2,
            height / 2,
            0,
            width / 2,
            height / 2,
            radius,
          );
          backdrop.addColorStop(0, "rgba(0,0,0,0)");
          backdrop.addColorStop(1, vignette);
        },

        frame(surface, _time, delta) {
          // Scale by elapsed time so the drift speed is the same at 30fps as
          // at 60, rather than being tied to how often we happen to paint.
          const step = Math.max(speed, 0.1) * (delta > 0 ? delta / 16.667 : 1);

          switch (direction) {
            case "right":
              offset.x = (offset.x - step + squareSize) % squareSize;
              break;
            case "left":
              offset.x = (offset.x + step + squareSize) % squareSize;
              break;
            case "up":
              offset.y = (offset.y + step + squareSize) % squareSize;
              break;
            case "down":
              offset.y = (offset.y - step + squareSize) % squareSize;
              break;
            case "diagonal":
              offset.x = (offset.x - step + squareSize) % squareSize;
              offset.y = (offset.y - step + squareSize) % squareSize;
              break;
          }

          draw(surface);
        },

        still(surface) {
          draw(surface);
        },

        dispose() {
          const node = canvasRef.current;
          node?.removeEventListener("pointermove", onPointerMove);
          node?.removeEventListener("pointerleave", onPointerLeave);
        },
      } satisfies Scene;
    },
    { fps: 30, reducedMotion, maxDpr: 1.5 },
    [direction, speed, borderColor, hoverFillColor, squareSize],
  );

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        // Read back by resolveColors so the scene inherits theme tokens.
        ["--squares-border" as string]:
          "color-mix(in oklab, var(--color-brand) 22%, transparent)",
        ["--squares-hover" as string]:
          "color-mix(in oklab, var(--color-brand) 12%, transparent)",
        ["--squares-vignette" as string]:
          "color-mix(in oklab, var(--color-canvas) 92%, transparent)",
      }}
    />
  );
};

export default Squares;
