import type { Metadata } from "next";
import Hero from "@/components/landing/hero";
import Marquee from "@/components/landing/marquee";
import NotAPlayground from "@/components/landing/not-a-playground";
import Workspace from "@/components/landing/workspace";
import HowItWorks from "@/components/landing/how-it-works";
import Stack from "@/components/landing/stack";
import YoursToRun from "@/components/landing/yours-to-run";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import { PauseOffscreen } from "@/components/landing/pause-offscreen";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The landing page, in the order a first-time visitor needs it:
 *
 *   what it is (hero) → the facts at a glance (marquee) → what "real" means
 *   (01) → the screen you land in (02) → how it works, with the demo (03) →
 *   what you can run (04) → self-hosting and agents (05) → price (06) →
 *   questions (07) → the index.
 *
 * Only one WebGL context runs on this page — the hero's CRT — and it pauses
 * as soon as the hero leaves the viewport. Everything below the fold is CSS
 * or scroll-linked transforms.
 */
export default function LandingPage() {
  return (
    <div className="relative isolate overflow-x-clip">
      <Hero />
      <PauseOffscreen>
        <Marquee />
      </PauseOffscreen>
      <NotAPlayground />
      <Workspace />
      <HowItWorks />
      <Stack />
      <YoursToRun />
      <Pricing n="06" />
      <Faq n="07" />
      <Footer />
    </div>
  );
}
