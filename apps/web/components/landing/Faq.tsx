import { FAQ } from "@/lib/agents";
import { Section } from "./section";

/**
 * The questions people ask before signing up.
 *
 * This section exists for two reasons that happen to want the same thing.
 *
 * The first is the honest one: the page explains what DevEx is and what it
 * costs, and then leaves the six questions everyone actually asks — do my
 * files survive, can I reach a port, can I self-host — to the docs. A reader
 * deciding whether to try it should not have to go and look.
 *
 * The second is that the `FAQPage` JSON-LD in the site graph has to correspond
 * to content a visitor can see. Markup describing answers that appear nowhere
 * on the page is a structured-data violation, and rightly so. Both the markup
 * and this section read `FAQ` from lib/agents.ts, so they cannot disagree.
 *
 * Plain `<details>`, no state, no client bundle: every answer is in the HTML
 * whether or not the reader opens it, which is also what makes it readable to
 * anything that does not run JavaScript.
 */
export default function Faq() {
  return (
    <Section
      id="faq"
      eyebrow="Questions"
      title={
        <>
          The ones worth <span className="text-brand">asking first.</span>
        </>
      }
      lead="Everything below is answered in more depth in the documentation. These are the short versions."
      contentClassName="mt-10"
    >
      <div className="overflow-hidden rounded-lg border border-edge">
        {FAQ.map(({ question, answer }, index) => (
          <details
            key={question}
            name="faq"
            className="group border-edge [&:not(:first-child)]:border-t"
            // The first one open, so the section reads as answers rather than
            // as a row of closed drawers.
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-4 text-left text-sm font-medium text-ink transition-colors duration-[--duration-fast] hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand">
              {question}
              {/* A rotating plus, drawn rather than imported: two spans is
                  cheaper than an icon component for a mark this simple. */}
              <span
                aria-hidden="true"
                className="relative size-3 shrink-0 text-ink-subtle transition-transform duration-[--duration-fast] group-open:rotate-45 group-open:text-brand"
              >
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-current" />
                <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-current" />
              </span>
            </summary>
            <p className="max-w-[68ch] px-5 pb-5 text-sm leading-relaxed text-ink-muted">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </Section>
  );
}
