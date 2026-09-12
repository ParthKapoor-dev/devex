"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { useActiveInView } from "@/hooks/use-active-in-view";
import { Section } from "./section";

/**
 * What actually happens when you click "start".
 *
 * The page went straight from a list of features to a price, with nothing in
 * between explaining the mechanism — and the mechanism is the most interesting
 * thing this product has. It was written down once, in the docs, where nobody
 * evaluating the product reads it.
 *
 * The `trace` line under each step is the point of the section: it names the
 * real API call, the real bucket layout, the real Kubernetes objects. For this
 * audience a plausible-looking trace does more than another paragraph of
 * adjectives.
 *
 * ## The animation
 *
 * On desktop all four steps are on screen at once, so a scroll-spy would have
 * nothing to say. Instead the section walks through the steps once when it
 * first comes into view and then stops permanently — the same discipline as
 * the hero preview. Hovering takes over from the walkthrough and cancels it,
 * because a pointer is a much better signal of interest than a timer.
 *
 * Under reduced motion nothing runs and no step is highlighted; every step is
 * legible at rest, so there is nothing to fall back to.
 */

const STEPS = [
  {
    at: "0ms",
    title: "You pick a template",
    body: "Core copies the template into object storage under your namespace and records the workspace against your account.",
    trace: "POST /repl/new  →  s3://devex/<you>/<id>/",
  },
  {
    at: "~200ms",
    title: "Kubernetes takes over",
    body: "A Deployment, a Service and an Ingress are created. The scheduler places the pod; the runner image is already on the node.",
    trace: "apply deploy/svc/ingress  →  Pending → Running",
  },
  {
    at: "~2s",
    title: "The runner attaches",
    body: "The container pulls your files back down and forks a PTY. Your browser opens WebSockets straight to it through the Ingress.",
    trace: "ws://<id>.repl/  →  pty attached, fs synced",
  },
  {
    at: "on stop",
    title: "Your work syncs back",
    body: "An ephemeral container pushes changed files to storage and the pod's CPU and memory go back to the cluster. Nothing is billed while it sleeps.",
    trace: "diff → s3 put  →  scale 0, resources released",
  },
] as const;

const WALK_INTERVAL_MS = 1100;

export default function Lifecycle() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useActiveInView(hostRef);

  // `walked` latches true once the walkthrough has run, so re-entering the
  // section on a scroll back up does not restart it.
  const [step, setStep] = useState(-1);
  const [walked, setWalked] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion || !inView || walked) return;

    let index = 0;
    setStep(0);

    const id = window.setInterval(() => {
      index += 1;
      if (index >= STEPS.length) {
        window.clearInterval(id);
        setWalked(true);
        setStep(-1);
        return;
      }
      setStep(index);
    }, WALK_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [reducedMotion, inView, walked]);

  // A pointer beats a timer: hovering cancels the walkthrough for good.
  const enter = (index: number) => {
    setHovered(index);
    setWalked(true);
  };

  const active = hovered ?? step;

  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="A pod, a PTY, and a bucket."
      lead="No image build on the critical path and no VM to wait on. Four things happen between the click and the prompt, and none of them are yours to manage."
    >
      <div
        ref={hostRef}
        className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-edge bg-edge lg:grid-cols-4"
        onMouseLeave={() => setHovered(null)}
      >
        {STEPS.map((entry, index) => {
          const isActive = active === index;
          return (
            <div
              key={entry.title}
              onMouseEnter={() => enter(index)}
              className={cn(
                "relative flex flex-col bg-canvas p-6",
                "transition-colors duration-[--duration-normal]",
                isActive ? "bg-surface" : "hover:bg-surface/60",
              )}
            >
              {/* The rail wipes in from the left rather than fading, so the
                  walkthrough reads as something moving through the steps.
                  `transform` and `opacity` only — both composited. */}
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-0 top-0 h-px origin-left bg-brand",
                  "transition-transform duration-[--duration-slow] ease-[--ease-out-circ]",
                  isActive ? "scale-x-100" : "scale-x-0",
                )}
              />

              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "font-mono text-xs tabular-nums transition-colors duration-[--duration-normal]",
                    isActive ? "text-brand" : "text-ink-subtle",
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs tabular-nums text-ink-subtle">
                  {entry.at}
                </span>
              </div>

              <h3 className="mt-4 font-medium text-ink">{entry.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">
                {entry.body}
              </p>

              <code
                className={cn(
                  "mt-5 block overflow-x-auto whitespace-pre rounded-xs border-l-2 bg-term-bg px-3 py-2",
                  "font-mono text-[11px] leading-relaxed text-term-muted",
                  "transition-colors duration-[--duration-normal]",
                  isActive ? "border-brand text-term-ink" : "border-edge",
                )}
              >
                {entry.trace}
              </code>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
