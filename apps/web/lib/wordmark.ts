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
