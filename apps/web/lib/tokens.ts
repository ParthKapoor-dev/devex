/**
 * Hex mirrors of the design tokens in `app/globals.css`.
 *
 * Three consumers cannot read CSS custom properties and need literals:
 *
 * 1. **Canvas 2D.** `strokeStyle` / `fillStyle` silently fall back to black
 *    when handed `var(--x)`, `oklch(...)` or an unresolved `currentColor`.
 * 2. **WebGL shaders.** Uniform colours are parsed by hand; our vendored
 *    React Bits backgrounds ship a `hexToRgb` that only understands `#rrggbb`.
 * 3. **Satori** (`next/og`) and the web-app manifest, neither of which
 *    evaluates a stylesheet at all.
 *
 * These are the sRGB clamps of the `--ds-*` oklch values. If you change a
 * token in globals.css, regenerate the matching entry here — nothing enforces
 * it at build time, and a drift shows up as a background that is subtly the
 * wrong colour rather than as an error.
 */
export const token = {
  brand300: "#ffd230",
  brand400: "#ffb900",
  brand500: "#fe9a00",
  brand600: "#e17100",
  brand950: "#461901",
  brandFg: "#180f09",

  canvas: "#080808",
  surface: "#101010",
  raised: "#191919",
  overlay: "#151515",

  ink: "#f8f8f8",
  inkMuted: "#9e9e9e",
  inkSubtle: "#696969",

  termBg: "#050505",
  termChrome: "#0c0c0c",
  termInk: "#e8e8e8",
  termAccent: "#33d977",

  success: "#21c46b",
  warning: "#fac800",
  danger: "#fb2c36",
  info: "#2b7fff",
} as const;
