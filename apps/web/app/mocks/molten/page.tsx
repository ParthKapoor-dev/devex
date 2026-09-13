import MoltenHero from "@/components/mocks/molten/hero";
import MoltenDemo from "@/components/mocks/molten/demo";
import { NotAPlayground, Stack } from "@/components/mocks/molten/truths";
import Previews from "@/components/landing/Previews";
import Lifecycle from "@/components/landing/Lifecycle";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Closing from "@/components/landing/Closing";
import Footer from "@/components/landing/Footer";

// MOCK — direction A · Molten. Custom top half, existing sections below.

export default function MoltenLanding() {
  return (
    <div className="relative isolate pb-24">
      <MoltenHero />
      <MoltenDemo />
      <NotAPlayground />

      <section className="px-4 pt-28 sm:px-6 sm:pt-36">
        <div className="mx-auto max-w-5xl">
          <p className="label mb-5 flex items-center gap-3 text-ink-subtle">
            <span className="text-brand">03</span>
            <span className="h-px w-8 bg-edge-strong" />
            Try the workspace
          </p>
          <h2 className="font-display text-[clamp(2.25rem,6vw,4.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-ink">
            Editor left. Shell below.
            <br />
            <span className="text-ink-subtle">Click around, it&rsquo;s live.</span>
          </h2>
        </div>
        <Previews />
      </section>

      <Stack />

      <div className="mx-auto max-w-6xl">
        <Lifecycle />
        <Pricing />
        <Faq />
        <Closing />
        <Footer />
      </div>
    </div>
  );
}
