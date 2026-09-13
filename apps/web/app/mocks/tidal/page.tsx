import type { Metadata } from "next";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import { TidalHero } from "@/components/mocks/tidal/hero";
import { SpecStrip } from "@/components/mocks/tidal/spec-strip";
import { TidalStack } from "@/components/mocks/tidal/stack";
import { TidalDemo } from "@/components/mocks/tidal/demo";
import { TidalBento } from "@/components/mocks/tidal/bento";
import { TidalClosing } from "@/components/mocks/tidal/closing";

/** MOCK — direction D · Tidal. Editorial, calm, confident. */
export const metadata: Metadata = { title: "Mock D · Tidal" };

export default function TidalLanding() {
  return (
    <main className="relative overflow-x-clip bg-canvas">
      <TidalHero />
      <SpecStrip />
      <TidalStack />
      <TidalDemo />
      <div className="h-28 sm:h-40" />
      <TidalBento />
      <div className="h-16 sm:h-24" />
      {/* Reused landing sections, in their own max-w container. */}
      <div className="mx-auto max-w-6xl">
        <Pricing />
        <Faq />
      </div>
      <TidalClosing />
      <div className="mx-auto max-w-6xl pb-20">
        <Footer />
      </div>
    </main>
  );
}
