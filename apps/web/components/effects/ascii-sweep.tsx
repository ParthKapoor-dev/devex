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
const RAMP = ["▓", "▒", "▒", "░", "░", "·", " "];

const LOOP_MS = 4200;
const BAND = 0.15; // fraction of the travel that is "inside" the sweep
const SKEW = 0.5; // how diagonal the band is
/** How far ahead of the band a character starts to brighten. */
const HALO = 0.45;

export type SweepLine = {
  /** Drawn in column 0 in its own colour — a prompt, an arrow, a gutter mark. */
  prefix?: string;
  text: string;
  /** Hex. Canvas cannot resolve `var()` or `oklch()`; see lib/tokens.ts. */
  colour?: string;
  prefixColour?: string;
};

export function AsciiSweep({
  lines,
  className,
  fontSize = 13,
  lineRatio = 1.65,
  mode = "scroll",
}: {
  lines: readonly SweepLine[];
  className?: string;
  fontSize?: number;
  /** Line height as a multiple of the font size. Match the block it replaces. */
  lineRatio?: number;
  /**
   * `scroll` runs the band once as the block rises into view and finishes
   * before it settles, so a reader who has stopped to read is never left
   * looking at dissolved text. `loop` keeps going; it is for the lab.
   */
  mode?: "scroll" | "loop";
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
        lineHeight = fontSize * lineRatio;
      };

      const paint = (surface: SceneSurface, head: number) => {
        const { ctx, width, height } = surface;
        ctx.clearRect(0, 0, width, height);
        ctx.font = `${fontSize}px "Commit Mono", ui-monospace, monospace`;
        ctx.textBaseline = "top";

        const travel = width + height * SKEW;
        const band = travel * BAND;

        for (let row = 0; row < lines.length; row++) {
          const line = lines[row];
          const y = row * lineHeight;
          if (y > height) break;

          const prefix = line.prefix ?? "";
          const gap = prefix ? prefix.length + 2 : 0;

          // One run per glyph, but the resting colour comes from the line, so
          // a terminal keeps its prompt/response colouring when the band is
          // nowhere near it.
          const run = (chars: string, startCol: number, rest: string) => {
            for (let i = 0; i < chars.length; i++) {
              const ch = chars[i];
              if (ch === " ") continue;
              const col = startCol + i;
              const x = col * advance;
              if (x > width) break;

              const d = x + y * SKEW - head;

              let glyph = ch;
              let colour = rest;
              let alpha = 0.85;
              let lift = 0;

              if (d > -band && d < band * (1 + HALO)) {
                const n = jitter(col, row);

                if (d > band) {
                  // Ahead of the band: not dissolved yet, but warming up. This
                  // is what stops it looking like a hard wipe.
                  const t = 1 - (d - band) / (band * HALO);
                  alpha = 0.85 + t * 0.15;
                  lift = -t * n * 1.6;
                } else {
                  // Inside. `t` is 0 at the trailing edge and 1 at the leading
                  // one, so text is already restored behind the band.
                  const t = (d + band) / (band * 2);
                  const step = Math.min(
                    RAMP.length - 1,
                    Math.floor(t * RAMP.length * (0.6 + n * 0.75)),
                  );
                  if (step > 0) {
                    glyph = RAMP[step];
                    colour = token.brand500;
                    alpha = 1 - step * 0.09;
                    lift = (n - 0.5) * step * 0.9;
                  } else {
                    colour = token.ink;
                    alpha = 1;
                  }
                }
              }

              ctx.globalAlpha = alpha;
              ctx.fillStyle = colour;
              ctx.fillText(glyph, x, y + lift);
            }
          };

          if (prefix) run(prefix, 0, line.prefixColour ?? token.inkSubtle);
          run(line.text, gap, line.colour ?? token.inkMuted);
        }
        ctx.globalAlpha = 1;
      };

      /**
       * Where the band is, from how far the block has risen up the viewport.
       * It finishes around the point the block reaches the middle of the
       * screen, so it is over before anyone starts reading.
       */
      const scrolled = (surface: SceneSurface) => {
        const canvas = canvasRef.current;
        if (!canvas) return -1e9;
        const rect = canvas.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const q = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.85)));
        const travel = surface.width + surface.height * SKEW;
        return q * (travel + travel * BAND * 2.4) - travel * BAND * 1.2;
      };

      return {
        resize: measure,
        frame(surface, time) {
          if (mode === "loop") {
            const travel = surface.width + surface.height * SKEW;
            const span = travel * (1 + BAND * 2);
            paint(surface, ((time % LOOP_MS) / LOOP_MS) * span - travel * BAND);
          } else {
            paint(surface, scrolled(surface));
          }
        },
        still(surface) {
          // The text, plainly, with no band anywhere near it.
          measure(surface);
          paint(surface, -1e9);
        },
      };
    },
    { fps: 30, maxDpr: 2, reducedMotion },
    [lines, fontSize, lineRatio, mode, reducedMotion],
  );

  return (
    <div className={cn("relative", className)}>
      {/* The real text: readable, selectable, findable. The canvas is paint. */}
      <pre
        className="pointer-events-none invisible m-0 whitespace-pre font-mono"
        style={{ fontSize, lineHeight: lineRatio }}
      >
        {lines
          .map((l) => (l.prefix ? `${l.prefix}  ${l.text}` : l.text))
          .join("\n")}
      </pre>
      <canvas ref={canvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <span className="sr-only">{lines.map((l) => l.text).join(". ")}</span>
    </div>
  );
}
