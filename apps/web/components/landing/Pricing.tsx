"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
// `framer-motion` is not a dependency — it only resolved because `motion`
// happens to depend on it. Import from `motion/react`, as everywhere else.
import NumberFlow from "@number-flow/react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";
import { token } from "@/lib/tokens";
import { PLANS, SPEC_ROWS, type Plan } from "@/lib/pricing";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { Section, HairlineGrid } from "./section";

/**
 * Pricing, as a spec sheet.
 *
 * The previous version was the last section left over from before the
 * redesign, and it broke the accent rule harder than anything else on the
 * site: twenty-two amber icon bubbles, an amber glow, an amber savings pill and
 * an amber gradient wash, on a page whose whole premise is that amber means
 * "this is the thing you are on". Everything was centred, in a bold weight the
 * display face is not meant to carry, inside cards that looked nothing like
 * the hairline grid directly above them.
 *
 * What replaced it leans on the one thing a developer actually reads a pricing
 * page for: the numbers. The plans share an identical set of spec rows, so
 * `2 / 25 / Unlimited` line up horizontally across the three columns and the
 * comparison needs no table. Units are the Kubernetes ones, because that is
 * what the limits genuinely are.
 */

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const reducedMotion = useReducedMotion();

  const choose = useCallback(
    (next: boolean, event: React.MouseEvent<HTMLButtonElement>) => {
      setAnnual(next);

      // A small reward for finding the cheaper option, fired from the button
      // itself so the burst starts where the pointer already is. Suppressed
      // outright under reduced motion rather than slowed down.
      if (!next || reducedMotion) return;

      const rect = event.currentTarget.getBoundingClientRect();
      confetti({
        particleCount: 44,
        spread: 62,
        startVelocity: 26,
        gravity: 1.2,
        decay: 0.93,
        ticks: 160,
        scalar: 0.8,
        origin: {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        },
        // canvas-confetti parses hex itself and cannot resolve `var()` or
        // `oklch()` — these come from the token mirrors in lib/tokens.
        colors: [token.brand300, token.brand400, token.brand500, token.brand600],
        shapes: ["circle", "square"],
        disableForReducedMotion: true,
      });
    },
    [reducedMotion],
  );

  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title={
        <>
          Start free. <span className="text-brand">Scale when you do.</span>
        </>
      }
      lead="Every plan runs the same containers on the same cluster. What changes is how many you get at once, and how much you can ask of each."
      aside={<BillingToggle annual={annual} onChange={choose} />}
    >
      <HairlineGrid className="grid-cols-1 md:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCell key={plan.name} plan={plan} annual={annual} />
        ))}
      </HairlineGrid>

      <p className="mt-6 text-sm text-ink-subtle">
        Self-hosting is free and always will be —{" "}
        <Link
          href="/docs/self-hosting"
          className="text-ink-muted underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
        >
          bring your own cluster
        </Link>{" "}
        and none of the above applies.
      </p>
    </Section>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * A segmented control, matching the dashboard's.
 *
 * It was a `Switch` with a word either side, which is the one control shape
 * where nobody can tell at a glance which of the two labels is currently
 * selected — both are always visible and only the slider's position says which
 * one won. Two buttons with an explicit selected state cannot have that
 * problem.
 */
function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean;
  onChange: (annual: boolean, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Billing period"
      className="inline-flex items-center gap-0.5 rounded-md border border-edge bg-canvas p-0.5"
    >
      {[
        { value: false, label: "Monthly", note: null },
        { value: true, label: "Annual", note: "−20%" },
      ].map(({ value, label, note }) => {
        const active = annual === value;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={(event) => onChange(value, event)}
            className={cn(
              "inline-flex items-center gap-2 rounded-sm px-3 py-1.5 font-mono text-xs",
              "transition-colors duration-[--duration-fast]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand",
              active
                ? "bg-raised text-ink"
                : "bg-transparent text-ink-subtle hover:text-ink-muted",
            )}
          >
            {label}
            {note ? (
              // A discount is information, not the primary action, so it is
              // never amber. Green only once it is the live choice.
              <span className={active ? "text-success" : "text-ink-subtle"}>
                {note}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function PlanCell({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.yearlyPrice : plan.price;

  return (
    <div
      className={cn(
        "relative flex flex-col p-6 transition-colors duration-[--duration-fast]",
        plan.popular ? "bg-surface" : "bg-canvas hover:bg-surface/60",
      )}
    >
      {/* The only amber on the whole section: a hairline over the plan we
          actually want people to take. */}
      {plan.popular ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-brand"
        />
      ) : null}

      <div className="flex items-center justify-between">
        <span className="label text-ink">{plan.name}</span>
        {plan.popular ? (
          <span className="label text-brand">Most popular</span>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        {plan.summary}
      </p>

      <div className="mt-6 flex items-baseline gap-1.5">
        <span className="font-display text-4xl font-medium tracking-[-0.03em] text-ink tabular-nums">
          <NumberFlow
            value={price}
            format={{
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }}
            transformTiming={{ duration: 420, easing: "ease-out" }}
            willChange
          />
        </span>
        {price > 0 ? (
          <span className="font-mono text-xs text-ink-subtle">/ month</span>
        ) : null}
      </div>
      <p className="mt-1.5 font-mono text-xs text-ink-subtle">
        {price === 0
          ? "forever, no card"
          : annual
            ? "billed annually"
            : "billed monthly"}
      </p>

      <Link
        href={plan.href}
        {...(plan.external
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className={cn(
          "mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium",
          "transition-colors duration-[--duration-fast]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
          plan.popular
            ? "bg-brand text-brand-fg hover:bg-brand-400"
            : "border border-edge-strong text-ink hover:bg-raised",
        )}
      >
        {plan.cta}
      </Link>

      {/* The spec block. Every plan declares the same rows in the same order,
          so the values line up across the three columns and the reader can
          compare down a line without a table. */}
      <dl className="mt-8 space-y-2 border-t border-edge pt-6 font-mono text-xs">
        {SPEC_ROWS.map((row, index) => (
          <div key={row} className="flex items-baseline justify-between gap-4">
            <dt className="text-ink-subtle">{row}</dt>
            <dd className="tabular-nums text-ink">{plan.specs[index]}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-6 space-y-2 border-t border-edge pt-6">
        {plan.extras.map((extra) => (
          <li key={extra} className="flex gap-2.5 text-sm text-ink-muted">
            <Check
              className="mt-[3px] size-3.5 shrink-0 text-ink-subtle"
              aria-hidden="true"
            />
            {extra}
          </li>
        ))}
      </ul>
    </div>
  );
}
