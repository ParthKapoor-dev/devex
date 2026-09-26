/**
 * The DevEx mark as a 5x7 bitmap font.
 *
 * Lifted out of `components/brand/block-wordmark.tsx` so the canvas wordmark
 * can share it without pulling a client component — and so there is one
 * definition of the letterforms rather than two that can drift apart.
 */

const GLYPHS: Record<string, string[]> = {
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  V: ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  " ": ["0", "0", "0", "0", "0", "0", "0"],
};

/** Rows of "0"/"1", one column of gap between letters. */
export function bitmap(word: string) {
  const rows = Array.from({ length: 7 }, () => "");
  [...word.toUpperCase()].forEach((ch, i) => {
    const g = GLYPHS[ch] ?? GLYPHS[" "];
    for (let r = 0; r < 7; r++) rows[r] += (i ? "0" : "") + g[r];
  });
  return rows;
}

/**
 * The logo's X, as two stroke quads in a unit box (y down).
 *
 * Traced off `public/logo.png` rather than approximated with the font's `X`
 * glyph, because the mark is not a letter X: the two strokes have flat,
 * horizontal end caps, and the `\` stroke is inset at both ends while the `/`
 * stroke runs corner to corner. That asymmetry is the whole signature — a
 * symmetrical X reads as a close, generic cousin of the logo, which is worse
 * than not using the logo at all.
 */
export const MARK_X: readonly (readonly (readonly [number, number])[])[] = [
  // The long `/`: top-right corner to bottom-left corner, full bleed.
  [
    [0.75, 0],
    [1, 0],
    [0.258, 1],
    [0, 1],
  ],
  // The short `\`: inset, and crossing the first one below its midpoint.
  [
    [0.125, 0.2],
    [0.375, 0.2],
    [0.862, 0.808],
    [0.612, 0.808],
  ],
];

/** Width / height of the box `MARK_X` is drawn in. */
export const MARK_X_ASPECT = 240 / 260;
