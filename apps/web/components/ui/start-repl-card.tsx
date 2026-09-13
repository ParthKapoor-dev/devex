"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CardProps {
  link: string;
  replName: string;
  onClose: () => void;
}

/**
 * Shown when a workspace finishes starting.
 *
 * The terminal framing is kept — it suits the product and it is the moment
 * where a shell metaphor actually means something. What changed:
 *
 * - **The dismiss button was `variant="destructive"`** — a red button, as the
 *   most prominent control, on a dialog announcing success. The thing you
 *   almost always want is to open the workspace, so that is the amber one now
 *   and dismissing is quiet.
 * - **The headline was `200`**, an HTTP status code set in 3xl bold. It told a
 *   user nothing that "started" does not.
 * - No `role`, no Escape, no backdrop dismiss.
 * - `border-dashed border-2` on everything, which belongs to no other surface
 *   in the app.
 */

const EXIT_MS = 200;

export default function StartReplCard({ link, replName, onClose }: CardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => setIsMounted(true), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMounted(false);
      window.setTimeout(onClose, EXIT_MS);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const handleClose = () => {
    setIsMounted(false);
    // Matches the transition below. Both read the same constant so they cannot
    // drift apart — they were a hardcoded 300 in two places.
    window.setTimeout(onClose, EXIT_MS);
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "transition-colors duration-[--duration-slow]",
        isMounted ? "bg-canvas/70 backdrop-blur-sm" : "bg-transparent",
      )}
    >
      <button
        type="button"
        aria-label="Dismiss"
        onClick={handleClose}
        className="absolute inset-0 cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${replName} is running`}
        className={cn(
          "relative w-full max-w-md overflow-hidden rounded-lg border border-edge bg-surface",
          "shadow-[0_24px_64px_-24px_rgb(0_0_0/0.9)]",
          "transition-[opacity,transform] duration-[--duration-slow] ease-[--ease-out-circ]",
          isMounted ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-edge px-3 py-2">
          <span
            className="size-1.5 rounded-full bg-term-accent"
            aria-hidden="true"
          />
          <span className="font-mono text-xs text-ink-muted">
            {replName}
            <span className="text-ink-subtle"> · running</span>
          </span>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Dismiss"
            className="ml-auto rounded-sm p-1 text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Transcript */}
        <div className="bg-term-bg px-4 py-4 font-mono text-[13px] leading-[1.8]">
          <div className="text-term-muted">
            <span className="mr-2 text-term-accent" aria-hidden="true">
              $
            </span>
            <span className="text-term-ink">devex start {replName}</span>
          </div>
          <div className="text-term-muted">
            <span className="text-ink-subtle">➜</span> pod scheduled, files
            restored
          </div>
          <div className="text-term-muted">
            <span className="text-ink-subtle">➜</span> terminal attached
          </div>
          <div className="mt-1 flex items-center text-term-muted">
            <span className="mr-2 text-term-accent" aria-hidden="true">
              $
            </span>
            <span className="text-term-ink">cd /{replName}</span>
            <span
              aria-hidden="true"
              className="terminal-caret ml-px inline-block h-[1.1em] w-[0.5em] translate-y-[0.15em] bg-term-ink"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 border-t border-edge p-4">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-9 items-center justify-center rounded-md border border-edge px-4 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:bg-raised hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Not now
          </button>

          <Link
            href={link}
            className="group inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Open workspace
            <ArrowRight
              className="size-4 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
