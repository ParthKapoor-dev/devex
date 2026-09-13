import { Geist, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";

/**
 * The three families the site ships. Nothing else may be loaded.
 *
 * They are chosen to share construction so they sit together without looking
 * like a collage: Space Grotesk is effectively a proportional Space Mono, and
 * its cap-height (0.700em) is an exact match for Commit Mono's — so an
 * uppercase label in the display face lines up with one in the mono with no
 * per-site nudging.
 *
 * Total: ~85 KB across three preloaded woff2 subsets.
 *
 * Each family is exposed as `--font-*-face`, NOT `--font-sans`/`--font-mono`.
 * Those names are Tailwind theme keys: if next/font also wrote them, the
 * theme's `--font-sans: var(--font-sans)` would resolve to itself and every
 * font stack would silently collapse to the browser default.
 */

/**
 * Display. Headlines and the uppercase eyebrow labels only.
 *
 * Deliberately not a body face: its x-height is 0.486em, the lowest of
 * everything surveyed, so it thins out badly below ~20px. It also has no
 * italic — `font-style: italic` on this family synthesises a slant, which
 * looks broken. Keep emphasis in the sans.
 */
export const display = Space_Grotesk({
  // A single variable file covering wght 300..700. Passing `axes` here would
  // make Next request a static instance per weight instead.
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-face",
  preload: true,
});

/** Body and UI. */
export const sans = Geist({
  weight: "variable",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-face",
  preload: true,
});

/**
 * Code, the terminal, and anything showing a path or an identifier.
 *
 * Self-hosted from `@fontsource/commit-mono` (OFL-1.1) — it is not on Google
 * Fonts. Only the two upright weights are loaded; the italics exist in the
 * package but nothing in a terminal or an editor chrome needs them.
 */
export const mono = localFont({
  src: [
    {
      path: "../node_modules/@fontsource/commit-mono/files/commit-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../node_modules/@fontsource/commit-mono/files/commit-mono-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-mono-face",
  preload: true,
  // Next's automatic fallback metrics fit the face to Arial, which for a
  // monospace means a 131% size-adjust and a noticeably wrong fallback. A
  // mono should fall back to the platform mono at its own size.
  adjustFontFallback: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
});
