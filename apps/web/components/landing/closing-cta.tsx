import Link from "next/link";
import { DotWordmark } from "@/components/brand/dot-wordmark";
import { siteConfig } from "@/lib/site";

/**
 * The last thing on the page before the index.
 *
 * The page used to end FAQ → Footer, which left the only call to action in the
 * hero, seven screens up — a reader who scrolled the whole way and was
 * convinced had nothing to do at the bottom but scroll back.
 *
 * The `↵` promise is real here and not just a repeat of the hero's: the hero's
 * keydown listener is on `window` and the hero never unmounts, so Enter starts
 * a workspace from this end of the page too.
 *
 * The mark is the only thing to look at here, so nothing sits behind it: the
 * fire is one section further down, in the footer.
 *
 * A server component. Only the mark is a client island.
 */
export default function ClosingCta() {
  return (
    <section
      aria-labelledby="closing-cta"
      className="relative overflow-hidden px-6"
    >
      <div className="mx-auto max-w-5xl border-t border-edge py-20 text-center sm:py-24">
        <DotWordmark className="mx-auto aspect-[72/69] w-40 sm:w-52" />

        <h2
          id="closing-cta"
          className="mt-8 text-balance font-display text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-4xl"
        >
          Nothing to install.{" "}
          <span className="text-ink-subtle">The machine is already running.</span>
        </h2>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="group inline-flex h-12 items-center gap-3 rounded-sm bg-brand pl-4 pr-2 font-mono text-sm font-medium text-brand-fg shadow-[0_0_0_1px_var(--color-brand-400),0_10px_40px_-10px_var(--color-brand)] transition-[background-color,box-shadow] duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <span>
              <span className="opacity-55">$</span> start a workspace
            </span>
            <kbd
              aria-hidden="true"
              className="grid h-7 min-w-7 place-items-center rounded-xs border border-brand-fg/20 bg-brand-fg/10 px-1.5 text-xs"
            >
              ↵
            </kbd>
          </Link>

          <Link
            href="/docs/quickstart"
            className="inline-flex h-12 items-center gap-2.5 rounded-sm border border-brand/25 bg-canvas/50 px-4 font-mono text-sm text-brand-200 transition-colors duration-[--duration-fast] hover:border-brand/60 hover:text-brand-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            read the quickstart
          </Link>
        </div>

        <p className="mt-6 font-mono text-xs text-ink-subtle">
          free, no card ·{" "}
          <a
            href={siteConfig.repo}
            className="text-ink-muted underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:underline"
          >
            MIT, self-hostable
          </a>
        </p>
      </div>
    </section>
  );
}
