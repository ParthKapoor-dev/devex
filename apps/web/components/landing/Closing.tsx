import Link from "next/link";
import { Github } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import s from "./landing.module.css";

/**
 * The last ask, set as the prompt the hero promised.
 *
 * The hero boots a machine; this is the same machine waiting for input. One
 * primary action, and the two things somebody who scrolled this far might
 * want instead — the docs, or the source.
 *
 * A server component. The glow and scanlines are CSS; the caret is the global
 * `terminal-caret` blink.
 */
export default function Closing() {
  return (
    <section aria-labelledby="closing-title" className="px-4 sm:px-6">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-2xl border border-brand/20 bg-term-bg px-6 py-20 sm:px-12 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_110%,color-mix(in_oklab,var(--color-brand)_18%,transparent),transparent_70%)]"
        />
        <div aria-hidden="true" className={cn(s.scanlines, "pointer-events-none absolute inset-0 opacity-50")} />

        <div className="relative text-center">
          <p className="font-mono text-xs text-ink-subtle sm:text-sm">
            <span className="text-brand/70">{"// "}</span>free plan · no card · two workspaces
          </p>
          <h2
            id="closing-title"
            className="mt-5 font-mono text-[clamp(1.75rem,7.5vw,5rem)] font-medium leading-none tracking-[-0.03em] text-ink"
          >
            <span className="text-ink-subtle">~ </span>
            <span className={cn(s.glow, "text-brand")}>$</span> devex start
            <span
              aria-hidden="true"
              className="terminal-caret ml-[0.1em] inline-block h-[0.85em] w-[0.5em] translate-y-[0.1em] bg-brand shadow-[0_0_24px_var(--color-brand)]"
            />
          </h2>
          <p className="mx-auto mt-6 max-w-md text-pretty leading-relaxed text-ink-muted">
            Sign in with GitHub, pick a template, and you have a container with
            your name on it. Nothing runs while you are away.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-3 rounded-sm bg-brand px-5 font-mono text-sm font-medium text-brand-fg shadow-[0_10px_40px_-10px_var(--color-brand)] transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <span aria-hidden="true">↵</span> start a workspace
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-12 items-center rounded-sm border border-edge-strong px-5 font-mono text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              man devex<span className="sr-only"> — read the docs</span>
            </Link>
            <a
              href={siteConfig.repo}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-sm border border-edge-strong px-5 font-mono text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <Github className="size-4" aria-hidden="true" />
              star on github
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
