import type { Metadata } from "next";
import Features from "@/components/landing/FeaturedPills";
import Lifecycle from "@/components/landing/Lifecycle";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Closing from "@/components/landing/Closing";
import Footer from "@/components/landing/Footer";
import { BlocksHero } from "@/components/mocks/blocks/hero";
import { DemoSplit, ProductShot } from "@/components/mocks/blocks/sections";

// MOCK — direction B · Blocks. The wordmark is the hero.

export const metadata: Metadata = {
  title: "Mock B · Blocks",
};

export default function BlocksMockPage() {
  return (
    <div className="relative isolate overflow-x-clip pb-24">
      <BlocksHero />
      <ProductShot />
      <DemoSplit />
      <div className="relative mx-auto max-w-6xl">
        <Features />
        <Lifecycle />
        <Pricing />
        <Faq />
        <Closing />
        <Footer />
      </div>
    </div>
  );
}
