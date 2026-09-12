import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";
import { siteConfig } from "@/lib/site";

/**
 * The last thing on the page.
 *
 * Pricing ran straight into the footer, so the only call to action a reader
 * who scrolled the whole way had was whichever plan button they had already
 * scrolled past. This is the second ask, and it offers both of the things
 * somebody at the bottom of this particular page might want: start one, or go
 * read how it works.
 *
 * A server component. It sits above the footer card, which is unchanged.
 */
export default function Closing() {
  return (
    <section className="px-6">
      <div className="mx-auto max-w-5xl border-t border-edge py-20 sm:py-24">
        <div className="relative overflow-hidden rounded-lg border border-edge bg-surface px-6 py-14 text-center sm:px-12">
          {/* One soft brand wash, the only place on the page it appears as a
              field rather than a mark. It reads as the end of the page. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_at_center,var(--color-brand-950)_0%,transparent_70%)] opacity-60"
          />

          <div className="relative">
            <p className="label mb-4 text-ink-subtle">
              Free tier, no card
            </p>

            <h2 className="mx-auto max-w-2xl text-balance font-display text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-4xl">
              The shell is about ten seconds away.
            </h2>

            <p className="mx-auto mt-4 max-w-lg text-balance leading-relaxed text-ink-muted">
              Sign in with GitHub, pick a template, and you have a container
              with your name on it. Delete it whenever — nothing is running
              while you are not.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login"
                className="group inline-flex h-11 items-center gap-2 rounded-md bg-brand px-5 text-sm font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Start a workspace
                <ArrowRight
                  className="size-4 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/docs"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-edge px-5 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Read the docs
              </Link>

              <a
                href={siteConfig.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-md border border-edge px-5 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Github className="size-4" aria-hidden="true" />
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
