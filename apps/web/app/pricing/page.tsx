import type { Metadata } from "next";
import Link from "next/link";
import Pricing from "@/components/landing/Pricing";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";
import AppBackdrop from "@/components/backgrounds/app-backdrop";
import { buildMetadata } from "@/lib/seo";
import { SELF_HOST_NOTE } from "@/lib/pricing";

export const metadata: Metadata = buildMetadata({
  title: "Pricing",
  description:
    "DevEx plans and limits. Free: two workspaces at 125m CPU and 256Mi memory each, no card. Professional and Enterprise scale the same containers. Self-hosting is free and unlimited.",
  path: "/pricing",
});

/**
 * `/pricing`.
 *
 * The plans already lived on the landing page at `/#pricing`, which is fine
 * for a reader scrolling and useless to anything looking for a price: a
 * fragment is not a page, so there was nothing to link to, nothing to put in
 * the sitemap, and nothing at the path every crawler and agent probes first.
 *
 * The same section, given a route. One plan table exists in the codebase
 * (lib/pricing.ts) and it renders here, on the landing page, in `/pricing.md`
 * and in the `Offer` nodes of the JSON-LD.
 */
export default function PricingPage() {
  return (
    <div className="relative isolate">
      <AppBackdrop />

      <div className="relative z-10 mx-auto max-w-6xl pt-24 sm:pt-28">
        <Pricing />
        <Faq />

        <section className="px-6">
          <div className="mx-auto max-w-5xl border-t border-edge py-14">
            <p className="max-w-2xl text-sm leading-relaxed text-ink-muted">
              {SELF_HOST_NOTE}{" "}
              <Link
                href="/docs/self-hosting"
                className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
              >
                The deployment guide
              </Link>{" "}
              covers the manifests and the environment it needs.
            </p>
            <p className="mt-4 font-mono text-xs text-ink-subtle">
              Machine-readable copy:{" "}
              <a
                href="/pricing.md"
                className="text-ink-muted underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
              >
                /pricing.md
              </a>
            </p>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}
