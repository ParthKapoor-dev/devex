"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { cn } from "@/lib/utils";
import s from "./landing.module.css";

/**
 * `true` once an element is *known* to be off-screen (or the tab hidden).
 *
 * Deliberately not `useActiveInView`, whose initial value is `false`: used to
 * pause CSS, that paused everything in the server HTML until hydration and the
 * first observer callback, which delayed the hero's entrance by however long
 * the JavaScript took to arrive. This starts `false` — running — and only
 * pauses on evidence.
 */
export function useOffscreen(ref: RefObject<HTMLElement | null>): boolean {
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let intersecting = true;
    const sync = () => setOffscreen(!intersecting || document.hidden);
    const io = new IntersectionObserver(([entry]) => {
      intersecting = entry.isIntersecting;
      sync();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [ref]);

  return offscreen;
}

/**
 * Pauses every CSS animation inside it while it is off-screen or the tab is
 * hidden.
 *
 * Browsers keep running infinite CSS animations that nobody can see — a
 * blinking caret or a marquee three screens away still restyles and
 * recomposites every frame. Measured on this page, that was ~10% of a main
 * thread at idle below the fold, all of it from animations out of view.
 */
export function PauseOffscreen({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const offscreen = useOffscreen(ref);
  return (
    <div ref={ref} className={cn(offscreen && s.paused, className)}>
      {children}
    </div>
  );
}
