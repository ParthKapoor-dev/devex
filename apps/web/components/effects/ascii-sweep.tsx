"use client";

import { useRef } from "react";
import { useCanvasScene, type SceneSurface } from "@/hooks/use-canvas-scene";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

/**
 * A band that crosses a block of text, dissolving it into glyphs as it passes.
 *
 * canvasui.dev's ASCII Sweep is the reference. It is not used here and none of
 * its code is: it needs a second WebGL2 context (forbidden below the fold),
 * its real trick depends on Chrome's HTML-in-Canvas origin trial that visitors
 * are not enrolled in, and it is MIT + Commons Clause.
 *
 * The expensive part of that component is that it operates on *arbitrary live
 * HTML*, which it has to screenshot into a texture every frame. Drop that
 * requirement — run it on text we already have as strings — and the whole
 * effect is a monospace grid on a 2D canvas: for each character, measure its
 * distance from the sweep line and map that to a glyph from a ramp. Same
 * gesture, ~2,000 cells instead of two million pixels, no GPU.
 *
 * The text stays in the DOM behind the canvas for screen readers and for
 * find-in-page; the canvas is decorative and sits on top.
 */

/** Dense to sparse. What a character decays through on its way out. */
const RAMP = ["█", "▓", "▒", "░", "·", " "];

const SWEEP_MS = 4200;
const BAND = 0.3; // fraction of the travel that is "inside" the sweep
const SKEW = 0.5; // how diagonal the band is

export function AsciiSweep({
  lines,
  className,
  fontSize = 13,
}: {
  lines: readonly string[];
  className?: string;
  fontSize?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useReducedMotion();

  useCanvasScene(
    canvasRef,
    () => {
      // A stable per-cell value, so a given character always decays the same
      // way rather than shimmering when the band crosses it twice.
      const jitter = (col: number, row: number) => {
        const v = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453;
        return v - Math.floor(v);
      };

      let advance = 0;
      let lineHeight = 0;

      const measure = ({ ctx }: SceneSurface) => {
        ctx.font = `${fontSize}px "Commit Mono", ui-monospace, monospace`;
        advance = ctx.measureText("M").width;
        lineHeight = fontSize * 1.65;
      };

      const paint = ({ ctx, width, height }: SceneSurface, time: number) => {
        ctx.clearRect(0, 0, width, height);
        ctx.font = `${fontSize}px "Commit Mono", ui-monospace, monospace`;
        ctx.textBaseline = "top";

        const travel = width + height * SKEW;
        const head = ((time % SWEEP_MS) / SWEEP_MS) * (travel * (1 + BAND * 2)) - travel * BAND;
        const band = travel * BAND;

        for (let row = 0; row < lines.length; row++) {
          const text = lines[row];
          const y = row * lineHeight;
          if (y > height) break;

          for (let col = 0; col < text.length; col++) {
            const ch = text[col];
            if (ch === " ") continue;
            const x = col * advance;
            if (x > width) break;

            // Distance from the sweep line, along its own axis.
            const along = x + y * SKEW;
            const d = along - head;

            let glyph = ch;
            let colour: string = token.inkMuted;
            let alpha = 0.72;

            if (d > -band && d < band) {
              // Inside the band. `t` runs 0 at the trailing edge to 1 at the
              // leading edge, so text decays ahead of the sweep and is already
              // restored behind it.
              const t = (d + band) / (band * 2);
              const n = jitter(col, row);
              const step = Math.min(
                RAMP.length - 1,
                Math.floor(t * RAMP.length * (0.65 + n * 0.7)),
              );
              if (step > 0) {
                glyph = RAMP[step];
                colour = token.brand500;
                alpha = 0.95 - step * 0.12;
              } else {
                colour = token.ink;
                alpha = 1;
              }
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = colour;
            ctx.fillText(glyph, x, y);
          }
        }
        ctx.globalAlpha = 1;
      };

      return {
        resize: measure,
        frame(surface, time) {
          paint(surface, time);
        },
        still(surface) {
          // The text, plainly, with no band anywhere near it.
          measure(surface);
          paint(surface, -1e9);
        },
      };
    },
    { fps: 30, maxDpr: 2, reducedMotion },
    [lines, fontSize, reducedMotion],
  );

  return (
    <div className={cn("relative", className)}>
      {/* The real text: readable, selectable, findable. The canvas is paint. */}
      <pre
        className="pointer-events-none invisible m-0 font-mono leading-[1.65]"
        style={{ fontSize }}
      >
        {lines.join("\n")}
      </pre>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <span className="sr-only">{lines.join(" ")}</span>
    </div>
  );
}
