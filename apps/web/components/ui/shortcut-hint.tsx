"use client";

import { cn } from "@/lib/utils";
import { useModifierKey } from "@/hooks/use-modifier-key";

/**
 * A keyboard chord, rendered as one inline token — `⌘K`, `Ctrl K`.
 *
 * Four triggers around the app rendered this as `{modifier}K`, which is right
 * on Apple and wrong everywhere else: `⌘` is a glyph, so it butts up against
 * the letter and still reads as two keys, but `Ctrl` is a *word*, and `CtrlK`
 * reads as one nonsense word rather than as a chord. The gap is therefore
 * conditional on the modifier being a glyph — which is exactly the distinction
 * `useModifierKey` already makes.
 *
 * The gap is in `em` so it tracks the 10–11px type these triggers use, rather
 * than sitting at a fixed pixel width that reads as a broken space.
 */
export function ShortcutHint({
  keyName,
  className,
}: {
  /** The non-modifier half of the chord, e.g. `"K"`. */
  keyName: string;
  className?: string;
}) {
  const modifier = useModifierKey();
  const isGlyph = modifier === "⌘";

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap",
        !isGlyph && "gap-[0.35em]",
        className,
      )}
    >
      <span>{modifier}</span>
      <span>{keyName}</span>
    </span>
  );
}
