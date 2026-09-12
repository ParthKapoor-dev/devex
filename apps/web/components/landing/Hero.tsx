"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import HeroVideoDialog from "../magicui/hero-video-dialog";
import ProductHuntBadge from "../ui/product-hunt-badge";
import GitHubStarBadge from "../ui/github-star";
import Preview from "./Previews";
import { cn } from "@/lib/utils";

/**
 * The opening.
 *
 * The badges lead, at the maintainer's request. The top padding comes down to
 * compensate so the headline still lands in roughly the same place.
 *
 * **The entrance is pure CSS.** Every element animates once, on load, with a
 * `rise` (or `line-rise`) keyframe and a hand-set delay — no
 * IntersectionObserver, no `motion` component, no state. The hero is above the
 * fold by definition, so there is nothing to observe: it is visible the
 * instant it mounts. That means zero JavaScript for the most-watched animation
 * on the site, and the whole sequence is switched off by the global
 * reduced-motion block, which now zeroes delays as well as durations.
 *
 * The delays live together in `BEAT` rather than sprinkled through the markup,
 * because what makes a staggered entrance work is the spacing *between* the
 * steps, and you cannot see that when the numbers are a hundred lines apart.
 */

/** Milliseconds after load at which each element starts. */
const BEAT = {
  badges: 0,
  eyebrow: 70,
  line1: 140,
  line2: 230,
  lead: 360,
  actions: 450,
  preview: 540,
} as const;

export default function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <>
      <HeroVideoDialog
        isVideoOpen={isVideoOpen}
        setIsVideoOpen={setIsVideoOpen}
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/Tlck20bJeFE"
      />

      <section className="px-6 pt-24 pb-4 text-center sm:pt-28">
        {/* Real social proof — an actual star count and an actual launch. */}
        <div
          className="mb-8 flex animate-rise flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: `${BEAT.badges}ms` }}
        >
          <GitHubStarBadge
            owner="parthkapoor-dev"
            repo="devex"
            size="small"
            theme="dark"
            showMetric="stars"
          />
          <ProductHuntBadge size="small" />
        </div>

        <p
          className="label mb-6 inline-flex animate-rise items-center gap-2 text-ink-subtle"
          style={{ animationDelay: `${BEAT.eyebrow}ms` }}
        >
          <span
            className="size-1.5 rounded-full bg-term-accent"
            aria-hidden="true"
          />
          Open source · Kubernetes native
        </p>

        {/* `flex flex-col` for one reason: each line's mask cancels its own
            descender padding with an equal negative margin, and adjacent
            negative margins *collapse* in normal flow — the two lines would
            only get one of the two back, opening a 17px gap the leading never
            asked for. Flex items do not collapse margins. */}
        <h1 className="mx-auto flex max-w-4xl flex-col font-display text-[clamp(2rem,9vw,3rem)] font-medium leading-[1.05] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
          <Line delay={BEAT.line1}>A real machine,</Line>
          <Line delay={BEAT.line2} className="text-brand">
            one tab away.
          </Line>
        </h1>

        {/* Two sentences, one job each: kill the wrong mental model, then land
            the thing that actually separates this from a web playground. The
            previous version was four claims in one breath, and its opening
            clause repeated both the eyebrow above it and the section below. */}
        <p
          className="mx-auto mt-7 max-w-xl animate-rise text-balance text-lg leading-relaxed text-ink-muted"
          style={{ animationDelay: `${BEAT.lead}ms` }}
        >
          Not a playground: a container with a real shell, a real filesystem,
          and a public URL. Up in seconds, still there tomorrow.
        </p>

        <div
          className="mt-10 flex animate-rise flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: `${BEAT.actions}ms` }}
        >
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

          <button
            type="button"
            onClick={() => setIsVideoOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-edge bg-surface/60 px-5 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Play className="size-4" aria-hidden="true" />
            Watch the demo
          </button>
        </div>

        <div
          className="animate-rise"
          style={{ animationDelay: `${BEAT.preview}ms` }}
        >
          <Preview />
        </div>
      </section>
    </>
  );
}

/**
 * One line of the headline, revealed from behind its own baseline.
 *
 * The outer span is the mask and the inner one travels. A fade alone reads as
 * a box appearing; type sliding up out of a clip reads as the line being
 * *set*. Two elements and a transform, so it composites on the GPU.
 *
 * The mask sizes to its content, so it never clips at rest even if the line
 * wraps on a narrow screen. The vertical padding — cancelled by an equal
 * negative margin, so the leading is untouched — is there for descenders: the
 * `y` in "away." paints below the line box, and a bare `overflow-hidden` would
 * shave it off.
 */
function Line({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span className="-my-[0.24em] block overflow-hidden py-[0.24em]">
      <span
        className={cn("block animate-line-rise", className)}
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </span>
    </span>
  );
}
