import type { Metadata } from "next";
import Hero from "@/components/landing/hero";
import Marquee from "@/components/landing/marquee";
import NotAPlayground from "@/components/landing/not-a-playground";
import Workspace from "@/components/landing/workspace";
import WhenYouReachForIt from "@/components/landing/when-you-reach-for-it";
import HowItWorks from "@/components/landing/how-it-works";
import Stack from "@/components/landing/stack";
import YoursToRun from "@/components/landing/yours-to-run";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import ClosingCta from "@/components/landing/closing-cta";
import Footer from "@/components/landing/Footer";
import { PauseOffscreen } from "@/components/landing/pause-offscreen";
import { SmoothScroll } from "@/components/smooth-scroll";
import { homeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The landing page, in the order a first-time visitor needs it:
 *
 *   what it is (hero) → the facts at a glance (marquee) → what "real" means
 *   (01) → the screen you land in (02) → when you would reach for it (03) →
 *   how it works, with the demo (04) → what you can run (05) → self-hosting
 *   and agents (06) → price (07) → questions (08) → the ask → the index.
 *
 * 03 is the only section about the reader rather than the machine. Everything
 * else explains the product; without it the page never says why anyone would
 * want one.
 *
 * Only one WebGL context runs on this page — the hero's CRT — and it pauses
 * as soon as the hero leaves the viewport. Everything below the fold is CSS
 * or scroll-linked transforms.
 *
 * `<SmoothScroll />` eases the page's own scroll position, which is what those
 * transforms read — so the whole page gained weight without any of them
 * changing. It is mounted here rather than in the root layout on purpose: the
 * sandbox must keep its native wheel.
 */
export default function LandingPage() {
  return (
    <div className="relative isolate overflow-x-clip">
      <script
        type="application/ld+json"
        // Built from static config, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()) }}
      />
      <SmoothScroll />
      <Hero />
      <PauseOffscreen>
        <Marquee />
      </PauseOffscreen>
      <NotAPlayground />
      <Workspace />
      <WhenYouReachForIt />
      <HowItWorks />
      <Stack />
      <YoursToRun />
      <Pricing n="07" />
      <Faq n="08" />
      <ClosingCta />
      <Footer />
    </div>
  );
}
