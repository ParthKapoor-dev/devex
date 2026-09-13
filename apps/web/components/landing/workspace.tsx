"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import Preview from "./Previews";
import { Eyebrow } from "./section";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The workspace itself — the interactive product shot.
 *
 * It enters tilted back and flattens as it scrolls into place, so the page
 * hands the reader the screen they will actually land in. Three transforms off
 * one scroll value, all composited; under reduced motion it is simply flat.
 */
export default function Workspace() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 25%"] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);

  return (
    <section id="workspace" aria-labelledby="workspace-title" className="relative px-4 pb-8 pt-28 sm:px-6 sm:pt-36">
      <div className="mx-auto max-w-5xl text-center">
        <Eyebrow n="02" className="justify-center">
          The workspace
        </Eyebrow>
        <h2
          id="workspace-title"
          className="mx-auto mt-5 max-w-3xl text-balance font-display text-3xl font-medium tracking-[-0.035em] text-ink sm:text-5xl"
        >
          Editor, terminal, public URL.{" "}
          <span className="text-ink-subtle">All in the same tab.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-balance text-ink-muted">
          This is the layout you land in once a workspace is running: files on
          the left, Monaco in the middle, a shell and port forwarding below.
          Click around — switch files, flip the panel.
        </p>
      </div>

      <div ref={ref} className="relative mx-auto mt-12 max-w-5xl [perspective:1400px]">
        <motion.div
          style={reduced ? undefined : { rotateX, scale, y, transformOrigin: "50% 0%" }}
          className="relative"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -top-10 bottom-1/3 -z-10 rounded-[50%] bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--color-brand-600)_30%,transparent)_0%,transparent_70%)] blur-2xl"
          />
          <div className="rounded-xl bg-[linear-gradient(180deg,color-mix(in_oklab,var(--color-brand)_55%,transparent),var(--color-edge)_35%,transparent)] p-px">
            <div className="rounded-[11px] bg-canvas/90 p-1.5 sm:p-2.5 [&>div]:mt-0">
              <Preview />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
