import { cn } from "@/lib/utils";

/**
 * The rhythm of the landing page.
 *
 * Every section below the hero shares one frame: a hairline rule, an uppercase
 * eyebrow, a display heading, an optional lead, and an optional control parked
 * on the right of the heading row.
 *
 * It exists because the page had no rhythm at all — the wrapper forced
 * `text-center` on everything, one section had opted out and gone left-aligned,
 * and each had invented its own heading sizes and spacing. Sections that all
 * start the same way are what let a reader tell where one ends and the next
 * begins, which is the job the rules and the eyebrows are doing here.
 *
 * A server component. Nothing in the frame is interactive.
 */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  aside,
  children,
  contentClassName,
}: {
  id?: string;
  eyebrow: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Parked at the end of the heading row on desktop, below it on mobile. */
  aside?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <section id={id} className="px-6">
      {/* The rule sits on the inner container so it matches the content width
          rather than the page container, which is wider. */}
      <div className="mx-auto max-w-5xl border-t border-edge py-20 text-left sm:py-24">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="label mb-3 text-ink-subtle">{eyebrow}</p>
            <h2 className="text-balance font-display text-3xl font-medium leading-[1.1] tracking-[-0.03em] text-ink sm:text-4xl">
              {title}
            </h2>
            {lead ? (
              <p className="mt-4 text-balance leading-relaxed text-ink-muted sm:text-lg">
                {lead}
              </p>
            ) : null}
          </div>
          {aside ? <div className="shrink-0">{aside}</div> : null}
        </div>

        <div className={cn("mt-12", contentClassName)}>{children}</div>
      </div>
    </section>
  );
}

/**
 * The hairline grid used for feature and plan cells.
 *
 * The 1px gaps over a `bg-edge` parent *are* the dividers, so no cell draws a
 * border of its own and no two borders ever double up between neighbours.
 */
export function HairlineGrid({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-lg border border-edge bg-edge",
        className,
      )}
    >
      {children}
    </div>
  );
}
