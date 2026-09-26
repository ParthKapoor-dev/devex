"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { registerScrollController } from "@/lib/smooth-scroll";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * Page-level smooth scrolling.
 *
 * Lenis does not transform the page. It intercepts the wheel and writes the
 * real `scrollTop` on an eased curve, so everything that reads the scroll
 * position keeps working untouched — `position: sticky`, `IntersectionObserver`,
 * find-in-page, the scrollbar, and every `useScroll()` on this page. The
 * assembling headline, the workspace tilt and the header condense all became
 * smooth without an edit, because their input became smooth.
 *
 * **Mount it per route, never in the root layout.** `/repl/[slug]` is Monaco
 * and xterm; taking the wheel there would be actively hostile.
 *
 * **Touch is left alone.** `syncTouch` stays off, so phones keep the
 * platform's own scrolling — already good, and where Lenis has its worst edge
 * cases. This is a pointer-and-wheel improvement only.
 *
 * **Reduced motion gets no instance at all.** Lenis would honour the setting
 * by snapping `lerp` to 1, but it would still be intercepting every wheel
 * event and a rAF loop would still be running to do nothing.
 *
 * Nested scrollers opt out with `data-lenis-prevent` and its per-axis
 * variants — see `components/ui/scroll-area.tsx` and the workspace preview.
 */

/**
 * How hard the scroll is damped: the fraction of the remaining distance
 * covered each frame, corrected for frame rate so 120Hz matches 60Hz.
 *
 * Lower is floatier. `0.12` was the first try and read as slightly brisk, so
 * this sits at Lenis's own default: enough glide for the scroll to have
 * weight, not so much that the page feels slow to answer. It is the one
 * number worth arguing about — turn it up to tighten the page, down to make
 * it heavier.
 */
const LERP = 0.1;

export function SmoothScroll() {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;

    const lenis = new Lenis({
      lerp: LERP,
      smoothWheel: true,
      syncTouch: false,
      // Anchor clicks glide instead of jumping. Lenis reads the root's own
      // `scroll-padding-top` when it resolves the target, so `#pricing` clears
      // the sticky header without an offset of our own — passing one here
      // subtracted the header twice and parked every target 96px too low.
      anchors: true,
    });

    registerScrollController(lenis);

    // Our own loop rather than `autoRaf`, so it can stop with the tab. It
    // does run while the page sits idle: Lenis has to be able to answer the
    // very first wheel delta in the same frame it arrives, and there is no
    // way to wake a loop from an event it has not seen yet.
    let frame = 0;

    const tick = (now: number) => {
      lenis.raf(now);
      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const sync = () => (document.hidden ? stop() : start());

    sync();
    document.addEventListener("visibilitychange", sync);

    return () => {
      document.removeEventListener("visibilitychange", sync);
      stop();
      registerScrollController(null);
      lenis.destroy();
    };
  }, [reducedMotion]);

  return null;
}
