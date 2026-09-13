"use client";

import Link from "next/link";
import { LoginButton } from "@/components/Auth/LoginButton";
import { WaveField } from "@/components/mocks/tidal/wave-field";

/**
 * MOCK — direction D · Tidal login. Split screen: amber wave panel with the
 * tagline on the left, the real sign-in form on flat canvas on the right.
 * Deliberately does not redirect signed-in users (it is a mock).
 */

const FACTS = [
  ["editor", "Monaco"],
  ["shell", "xterm.js"],
  ["storage", "persists to S3"],
  ["network", "public URL per port"],
];

export default function TidalLogin() {
  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-2">
      {/* Wave panel */}
      <section className="relative isolate flex min-h-[340px] flex-col overflow-hidden border-b border-edge px-5 pt-[88px] pb-6 sm:px-8 lg:min-h-dvh lg:border-r lg:border-b-0 lg:px-12 lg:pb-10">
        <WaveField
          mask="linear-gradient(to bottom, transparent 0%, black 30%, black 100%)"
          lineColor="rgba(254, 154, 0, 0.4)"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklab, var(--color-canvas) 85%, transparent) 0%, transparent 55%)",
          }}
        />

        <div className="relative flex items-center justify-between border-b border-edge pb-3">
          <Link href="/mocks/tidal" className="label text-ink transition-colors hover:text-brand">
            devex
          </Link>
          <span className="label text-ink-subtle">N° 00 — Sign in</span>
        </div>

        <div className="relative mt-auto pt-10">
          <p className="font-display text-[clamp(2.6rem,9vw,4.25rem)] font-medium leading-[0.92] tracking-[-0.05em] text-ink xl:text-[5.5rem]">
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-line-rise">Your dev box,</span>
            </span>
            <span className="block overflow-hidden pb-[0.06em]">
              <span className="block animate-line-rise text-gradient-brand" style={{ animationDelay: "90ms" }}>
                one tab away.
              </span>
            </span>
          </p>

          <dl className="mt-8 hidden grid-cols-2 gap-x-8 border-t border-edge pt-5 font-mono text-xs sm:grid lg:mt-12">
            {FACTS.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-edge py-2">
                <dt className="text-ink-subtle">{k}</dt>
                <dd className="text-ink-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Form */}
      <section className="flex flex-col px-5 py-12 sm:px-8 lg:px-12 lg:pt-[88px] lg:pb-10">
        <div className="hidden justify-between border-b border-edge pb-3 lg:flex">
          <span className="label text-ink-subtle">Fig. 00</span>
          <span className="label text-ink-subtle">GitHub · Magic link</span>
        </div>

        <div className="mx-auto my-auto w-full max-w-sm py-4 lg:py-16">
          <p className="label mb-4 inline-flex items-center gap-2 text-ink-subtle">
            <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
            Free plan · no card
          </p>
          <h1 className="font-display text-4xl font-medium tracking-[-0.04em] text-ink">
            Sign in
          </h1>
          <p className="mt-2 mb-8 leading-relaxed text-ink-muted">
            Spin up a containerised dev environment in your browser.
          </p>

          <LoginButton />

          <p className="mt-8 text-xs leading-relaxed text-ink-subtle">
            By continuing you agree to the Terms of Service and{" "}
            <Link href="/privacy" className="underline decoration-edge-strong underline-offset-2 hover:text-ink">
              Privacy Policy
            </Link>
            .
          </p>
        </div>

        <div className="mt-8 flex justify-between border-t border-edge pt-3">
          <span className="label text-ink-subtle">Open source</span>
          <Link href="/mocks/tidal" className="label text-ink-subtle hover:text-ink">
            ← Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
