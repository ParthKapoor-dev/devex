"use client";

import { useInView, useMotionValue, useSpring } from "motion/react";
import { ComponentPropsWithoutRef, useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface NumberTickerProps extends ComponentPropsWithoutRef<"span"> {
  value: number;
  startValue?: number;
  direction?: "up" | "down";
  delay?: number;
  decimalPlaces?: number;
}

export function NumberTicker({
  value,
  startValue = 0,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(direction === "down" ? value : startValue);
  // Near-critical damping. At 60 the spring was three times overdamped and
  // took ~5s of per-frame DOM writes to count up to a three-digit number.
  const springValue = useSpring(motionValue, {
    damping: 24,
    stiffness: 110,
  });
  const isInView = useInView(ref, { once: true, margin: "0px" });

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionValue.set(direction === "down" ? startValue : value);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [motionValue, isInView, delay, value, direction, startValue]);

  useEffect(() => {
    // One formatter, not one per frame.
    const format = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
    let last = "";
    return springValue.on("change", (latest) => {
      const text = format.format(Number(latest.toFixed(decimalPlaces)));
      // Skip the write when the rounded number has not changed.
      if (ref.current && text !== last) ref.current.textContent = last = text;
    });
  }, [springValue, decimalPlaces]);

  return (
    <span
      ref={ref}
      className={cn(
        "inline-block tabular-nums tracking-wider text-black dark:text-white",
        className,
      )}
      {...props}
    >
      {startValue}
    </span>
  );
}
