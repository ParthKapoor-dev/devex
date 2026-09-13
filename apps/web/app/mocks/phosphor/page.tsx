import Previews from "@/components/landing/Previews";
import Lifecycle from "@/components/landing/Lifecycle";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import { BootHero } from "@/components/mocks/phosphor/boot-hero";
import {
  ClosingPrompt,
  Interstitial,
  ManPage,
  MonitorDemo,
  NotAPlayground,
} from "@/components/mocks/phosphor/sections";

/** MOCK — direction C · Phosphor. An amber CRT that boots like a machine. */
export default function PhosphorLanding() {
  return (
    <div className="relative isolate pb-24">
      <BootHero />
      <NotAPlayground />
      <ManPage />
      <MonitorDemo />

      <div className="mx-auto max-w-6xl">
        <Interstitial>the editor below is live — click a file</Interstitial>
        <div className="px-6">
          <Previews />
        </div>
        <div className="h-20 sm:h-28" />
        <Lifecycle />
        <Pricing />
        <Faq />
      </div>

      <ClosingPrompt />

      <div className="mx-auto max-w-6xl">
        <Footer />
      </div>
    </div>
  );
}
