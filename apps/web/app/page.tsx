import type { Metadata } from "next";
import HeroSection from "@/components/landing/Hero";
import Features from "@/components/landing/FeaturedPills";
import Lifecycle from "@/components/landing/Lifecycle";
import Pricing from "@/components/landing/Pricing";
import Closing from "@/components/landing/Closing";
import Footer from "@/components/landing/Footer";
import SiteBackdrop from "@/components/landing/SiteBackdrop";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="relative isolate overflow-hidden pb-20">
      {/* Viewport-locked, so the canvas stays one screen tall however long the
          page gets. See components/landing/SiteBackdrop. */}
      <SiteBackdrop />

      {/* No `text-center` here. It used to sit on this wrapper, which meant
          every section had to opt out of it individually and one of them
          simply forgot. Centring is the hero's business alone. */}
      <div className="relative z-10 mx-auto max-w-6xl">
        <HeroSection />
        <Features />
        <Lifecycle />
        <Pricing />
        <Closing />
        <Footer />
      </div>
    </div>
  );
}
