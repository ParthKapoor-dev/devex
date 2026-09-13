import Link from "next/link";
import AppBackdrop from "@/components/backgrounds/app-backdrop";
import Footer from "@/components/landing/Footer";

/**
 * The frame for the site's prose pages — about, privacy, contact.
 *
 * These three are the pages a reader (or an agent deciding whether a project
 * is real) goes looking for, and until now the site had none of them. They are
 * text, so they get the docs' reading measure rather than the landing page's
 * full-bleed sections: one column, 68 characters, a display heading and an
 * eyebrow, on the same backdrop as every other signed-out surface.
 *
 * `pt-32` clears the fixed header, which is 56px plus its own offset.
 */
export function ProsePage({
  eyebrow,
  title,
  lead,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  /** ISO date, shown in the footer of the page. Only where it matters. */
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative isolate">
      <AppBackdrop />

      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-10 pt-32 sm:pt-36">
        <p className="label mb-3 text-ink-subtle">{eyebrow}</p>
        <h1 className="text-balance font-display text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 text-balance text-lg leading-relaxed text-ink-muted">
          {lead}
        </p>

        <hr className="my-10 border-edge" />

        <div className="prose-page">{children}</div>

        {updated ? (
          <p className="mt-14 border-t border-edge pt-5 font-mono text-xs text-ink-subtle">
            Last updated {updated}. Changes are in the git history —{" "}
            <Link
              href="/docs"
              className="text-ink-muted underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
            >
              read the docs
            </Link>{" "}
            for anything operational.
          </p>
        ) : null}
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <Footer />
      </div>
    </div>
  );
}

/** A titled block within a prose page. Keeps the heading rhythm identical. */
export function ProseSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="font-display text-xl font-medium tracking-[-0.02em] text-ink">
        {title}
      </h2>
      <div className="mt-3 space-y-4 text-[0.95rem] leading-relaxed text-ink-muted">
        {children}
      </div>
    </section>
  );
}
