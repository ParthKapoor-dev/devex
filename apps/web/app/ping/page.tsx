import type { Metadata } from "next";
import AppBackdrop from "@/components/backgrounds/app-backdrop";
import Footer from "@/components/landing/Footer";
import { StatusBoard } from "@/components/status/board";
import { buildMetadata } from "@/lib/seo";
import { API_ORIGIN } from "@/lib/agents";

export const metadata: Metadata = buildMetadata({
  title: "Status",
  description:
    "Live status of the DevEx control plane, its Kubernetes cluster, its object storage and its Redis. Checked against the API's own health endpoint.",
  path: "/ping",
});

/**
 * `/ping` — the status page.
 *
 * A server component wrapping one client island, which is the split this page
 * never had: the previous version was a single `"use client"` file that also
 * carried the page frame, an `@import` of Inter from Google Fonts at runtime,
 * and — the real problem — a `<style jsx global>` block redefining `.glass`.
 * That is a global utility used across the site, so mounting the status page
 * silently restyled every other glass surface until you navigated away.
 *
 * The colours were from two brands ago as well: emerald, teal and a stack of
 * raw `gray-*` values, on a site whose accent is amber and whose greys come
 * from tokens.
 */
export default function StatusPage() {
  return (
    <div className="relative isolate">
      <AppBackdrop />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="px-6 pt-32 sm:pt-36">
          <div className="mx-auto max-w-5xl">
            <p className="label mb-3 text-ink-subtle">Status</p>
            <h1 className="text-balance font-display text-4xl font-medium leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl">
              Is it running?
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-lg leading-relaxed text-ink-muted">
              Checked live against the control plane&rsquo;s own health
              endpoint. Nothing is cached and nothing is reported from a
              dashboard — this page asks{" "}
              <code className="rounded bg-raised px-1.5 py-0.5 font-mono text-[0.85em] text-ink">
                {API_ORIGIN.replace(/^https?:\/\//, "")}/ping
              </code>{" "}
              the same question your browser does when you open a workspace.
            </p>

            <StatusBoard />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
