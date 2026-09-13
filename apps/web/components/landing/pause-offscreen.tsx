"use client";

import { useRef } from "react";
import { useActiveInView } from "@/hooks/use-active-in-view";
import { cn } from "@/lib/utils";
import s from "./landing.module.css";

/**
 * Pauses every CSS animation inside it while it is off-screen or the tab is
 * hidden.
 *
 * Browsers keep running infinite CSS animations that nobody can see — a
 * blinking caret or a marquee three screens away still restyles and
 * recomposites every frame. Measured on this page, that was ~10% of a main
 * thread at idle below the fold, all of it from animations out of view.
 * Wrapping a section in this brings it to zero.
 */
export function PauseOffscreen({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "section";
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const active = useActiveInView(ref, { rootMargin: "0px" });
  return (
    <Tag ref={ref} className={cn(!active && s.paused, className)}>
      {children}
    </Tag>
  );
}
