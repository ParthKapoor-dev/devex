import type { Metadata } from "next";
import HeroSection from "@/components/landing/Hero";
import Features from "@/components/landing/FeaturedPills";
import Pricing from "@/components/landing/Pricing";
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

      <div className="relative z-10 mx-auto max-w-6xl text-center">
        <HeroSection />
        <Features />
        <Pricing />
        <Footer />
      </div>
    </div>
  );
}
