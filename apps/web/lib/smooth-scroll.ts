"use client";

import { useEffect } from "react";

/**
 * The seam between the smooth-scroll engine and everything that has to hold
 * the page still — modals, the command palette, the demo popover.
 *
 * Deliberately knows nothing about Lenis. Overlays live in the header and the
 * sandbox, which render on every route; importing the engine from them would
 * pull its bundle onto pages that never run it. The engine registers itself
 * here instead, and this module only ever sees two methods.
 */

type ScrollController = {
  stop: () => void;
  start: () => void;
};

let controller: ScrollController | null = null;

/** Called by `<SmoothScroll />` on mount, and with `null` on unmount. */
export function registerScrollController(next: ScrollController | null) {
  controller = next;
}

/**
 * Hold the smooth-scroll engine still while `active`.
 *
 * For overlays that already lock the page themselves — every Radix dialog
 * does, via `react-remove-scroll`. Their lock sets `overflow: hidden` on the
 * body, which the engine does not read: it drives `scrollTop` directly, so
 * without this the page slides along behind the open dialog.
 *
 * A no-op on routes where no engine is mounted.
 */
export function usePauseSmoothScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    controller?.stop();
    return () => controller?.start();
  }, [active]);
}

/**
 * Hold the page still while `active`: the engine *and* the body.
 *
 * For overlays that bring no lock of their own. Do not use it on a Radix
 * dialog — two locks would race over `body.style.overflow`, and whichever
 * restored second would restore the other's `hidden` and leave the page
 * frozen after the dialog closed.
 */
export function useScrollLock(active: boolean) {
  usePauseSmoothScroll(active);

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
