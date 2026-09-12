"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * Whether an element is worth animating right now.
 *
 * `true` only when the element is intersecting the viewport AND the tab is
 * visible. Use it to gate a `requestAnimationFrame` loop that you cannot move
 * to `useCanvasScene` — a bare rAF loop keeps burning CPU while scrolled past
 * and while the tab sits in the background.
 */
export function useActiveInView(
  ref: RefObject<HTMLElement | null>,
  { rootMargin = "128px" }: { rootMargin?: string } = {},
): boolean {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let intersecting = false;

    const sync = () => setActive(intersecting && !document.hidden);

    const observer = new IntersectionObserver(
      (entries) => {
        intersecting = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { rootMargin },
    );

    observer.observe(element);
    document.addEventListener("visibilitychange", sync);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref, rootMargin]);

  return active;
}
