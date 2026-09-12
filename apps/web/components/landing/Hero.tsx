"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import HeroVideoDialog from "../magicui/hero-video-dialog";
import ProductHuntBadge from "../ui/product-hunt-badge";
import GitHubStarBadge from "../ui/github-star";
import Preview from "./Previews";

/**
 * The opening.
 *
 * The badges used to be the very first thing on the page, above the eyebrow —
 * two pieces of third-party chrome standing between the visitor and any claim
 * about what this is. They have moved below the buttons, where they do the job
 * they are actually good at: reassuring somebody who has already read the
 * pitch and is deciding whether to click.
 */
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

      <section className="px-6 pt-28 pb-4 text-center sm:pt-36">
        <p className="label mb-6 inline-flex items-center gap-2 text-ink-subtle">
          <span
            className="size-1.5 rounded-full bg-term-accent"
            aria-hidden="true"
          />
          Open source · Kubernetes native
        </p>

        <h1 className="mx-auto max-w-4xl text-balance font-display text-5xl font-medium leading-[1.05] tracking-[-0.035em] text-ink sm:text-6xl lg:text-7xl">
          A real machine,
          <br />
          <span className="text-brand">one tab away.</span>
        </h1>

        <p className="mx-auto mt-7 max-w-xl text-balance text-lg leading-relaxed text-ink-muted">
          Containerised development environments on Kubernetes. A real terminal,
          a real filesystem, and ports you can reach from anywhere — running in
          seconds, in your browser.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
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

        {/* Real social proof — an actual star count and an actual launch. */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <GitHubStarBadge
            owner="parthkapoor-dev"
            repo="devex"
            size="small"
            theme="dark"
            showMetric="stars"
          />
          <ProductHuntBadge size="small" />
        </div>

        <Preview />
      </section>
    </>
  );
}
