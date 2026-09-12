"use client";

import Link from "next/link";
import Squares from "@/components/ui/background-squares";

/**
 * The frame shared by every unauthenticated page.
 *
 * Login gets the drifting square grid rather than the dashboard's static
 * backdrop: it is a page you are on for five seconds and it is the first
 * impression of the product, so a little motion is worth it. The canvas runs
 * through `useCanvasScene`, so it is DPR-capped, pauses when the tab is
 * hidden and paints a single still frame under `prefers-reduced-motion`.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-16">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <Squares
          speed={0.35}
          squareSize={64}
          direction="diagonal"
          // A token, resolved at runtime — `black` was the previous value,
          // which is invisible on a near-black canvas.
          borderColor="color-mix(in oklab, var(--color-ink) 7%, transparent)"
          hoverFillColor="color-mix(in oklab, var(--color-brand) 10%, transparent)"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70% 50% at 50% 40%, transparent 30%, var(--color-canvas) 100%)",
          }}
        />
      </div>

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="label inline-block text-ink-subtle transition-colors duration-[--duration-fast] hover:text-ink"
          >
            devex
          </Link>
          <h1 className="mt-5 font-display text-2xl font-medium tracking-[-0.02em] text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {subtitle}
            </p>
          )}
        </div>

        {children}

        {footer && (
          <div className="mt-8 text-center text-xs text-ink-subtle">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
