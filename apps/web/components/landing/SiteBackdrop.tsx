"use client";

import dynamic from "next/dynamic";
import { BRAND_HEX } from "@/lib/tokens";

/**
 * The page-length backdrop for the marketing site.
 *
 * Graphite + Signal puts the whole colour budget here: the chrome is
 * near-monochrome, so the backdrop is the only thing on the page allowed to
 * be expressive. It has to earn that without costing anything, so the layers
 * are ordered cheapest-first and only one of them animates.
 *
 *  0. Flat canvas — the body background, already painted before hydration.
 *  1. Engineering grid. Four repeating gradients: a fine 32px rule and a
 *     brighter 128px major rule. Two paints, zero DOM nodes, no animation.
 *     Radially masked so it dissolves rather than boxing the page in.
 *  2. Plasma — one WebGL quad at half resolution and 30fps, masked to the top
 *     of the viewport so it reads as atmosphere above the fold rather than as
 *     wallpaper behind the whole page. Client-only and lazily loaded.
 *  3. Grain. A single inline SVG turbulence tile at 3.5% opacity. This is the
 *     layer that makes a near-black page look like a material instead of a
 *     void — it breaks up the banding a large dark gradient always produces.
 *  4. Vignette and a bottom fade into flat canvas, so anything below the fold
 *     sits on solid colour and stays readable.
 *
 * Everything here is decorative: `aria-hidden`, `pointer-events-none`, and
 * behind a `z-0` so it never intercepts a click.
 */

// Client-only: a WebGL canvas has no meaningful server output, and keeping it
// out of the entry chunk means the hero text is interactive before the shader
// has even been fetched.
const Plasma = dynamic(() => import("@/components/backgrounds/plasma"), {
  ssr: false,
});

/**
 * Fractal-noise tile. Inlined as a data URI rather than shipped as a file so
 * it cannot cost a round trip — at this size base64 would be larger than the
 * markup, so the SVG goes in as-is with only `#` and `<`/`>` escaped.
 */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.42'/%3E%3C/svg%3E\")";

/** Both layers of the grid, and the mask that stops it at the fold. */
const GRID_LINE = "color-mix(in oklab, var(--color-ink) 7%, transparent)";
const GRID_LINE_MAJOR = "color-mix(in oklab, var(--color-ink) 11%, transparent)";
const GRID_MASK =
  "radial-gradient(125% 80% at 50% 0%, black 15%, transparent 72%)";

export default function SiteBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* 1a · Static brand wash. Carries the accent at zero runtime cost and
          is the only coloured thing on screen before the shader chunk has
          loaded, so there is no flash of colourless page on a slow connection
          — and it is the whole backdrop for anyone without WebGL. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 70% at 50% -15%, color-mix(in oklab, var(--color-brand) 16%, transparent) 0%, transparent 62%)",
        }}
      />

      {/* 1b · Engineering grid. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            `linear-gradient(to right, ${GRID_LINE_MAJOR} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${GRID_LINE_MAJOR} 1px, transparent 1px)`,
            `linear-gradient(to right, ${GRID_LINE} 1px, transparent 1px)`,
            `linear-gradient(to bottom, ${GRID_LINE} 1px, transparent 1px)`,
          ].join(","),
          backgroundSize: "128px 128px, 128px 128px, 32px 32px, 32px 32px",
          maskImage: GRID_MASK,
          WebkitMaskImage: GRID_MASK,
        }}
      />

      {/* 2 · The shader. Masked to the upper half so the colour reads as a
          light source above the page rather than as a texture behind it. */}
      <div
        className="absolute inset-x-0 top-0 h-[85vh]"
        style={{
          maskImage:
            "radial-gradient(100% 85% at 50% 0%, black 25%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(100% 85% at 50% 0%, black 25%, transparent 78%)",
        }}
      >
        <Plasma
          color={BRAND_HEX}
          speed={0.4}
          direction="forward"
          scale={1.5}
          opacity={0.42}
          mouseInteractive={false}
          renderScale={0.5}
          maxDpr={1.5}
          targetFps={30}
          iterations={40}
        />
      </div>

      {/* 3 · Grain. `overlay` keeps it out of the way in the dark areas and
          only bites where the shader is bright, which is exactly where a
          large gradient would otherwise band. */}
      <div
        className="absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: "160px 160px" }}
      />

      {/* 4 · Vignette, then a hard fade into flat canvas. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 35%, transparent 40%, color-mix(in oklab, var(--color-canvas) 70%, transparent) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-2/5"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--color-canvas) 85%)",
        }}
      />
    </div>
  );
}
