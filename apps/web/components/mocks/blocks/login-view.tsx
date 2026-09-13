"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { LoginButton } from "@/components/Auth/LoginButton";
import { BlockWordmark } from "./block-wordmark";
import { BorderBeam } from "./border-beam";

// MOCK (direction B) — login: blocks wordmark + pitch left, real form right,
// over an amber Dot Field. Deliberately does not redirect signed-in users.

const DotField = dynamic(() => import("@/components/mocks/dot-field"), { ssr: false });

const FACTS = [
  ["template", "node · python · go"],
  ["storage", "synced to object storage"],
  ["network", "a public url per port"],
] as const;

export function BlocksLogin() {
  const readout = useRef<HTMLSpanElement>(null);

  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <DotField
          dotRadius={1.6}
          dotSpacing={16}
          cursorRadius={420}
          bulgeStrength={60}
          glowRadius={220}
          gradientFrom="rgba(254, 154, 0, 0.6)"
          gradientTo="rgba(225, 113, 0, 0.28)"
          glowColor="#2a1606"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_80%_at_35%_45%,transparent_20%,var(--color-canvas)_100%)]" />
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-gradient-to-l from-canvas/60 to-transparent lg:block" />
      </div>

      <main className="mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 pb-24 pt-24 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:gap-16 lg:pt-20">
        {/* Pitch */}
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="label animate-rise text-ink-subtle">
            <Link href="/mocks/blocks" className="transition-colors hover:text-ink">
              devex
            </Link>{" "}
            / sign in
          </p>

          <div className="mt-6 w-[min(560px,88vw)] rounded-lg border border-edge bg-canvas/50 p-3 backdrop-blur-[2px] sm:p-5">
            <BlockWordmark readoutRef={readout} maxAngle={48} radius={3} className="w-full" entranceDelay={80} />
            <div className="mt-3 flex justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle">
              <span ref={readout} aria-hidden="true" className="tabular-nums text-brand/80">
                c-- · r--
              </span>
              <span>click a block</span>
            </div>
          </div>

          <h1
            className="mt-8 animate-rise text-balance font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink"
            style={{ animationDelay: "500ms" }}
          >
            Your machine is <span className="text-brand">waiting.</span>
          </h1>
          <p
            className="mt-4 max-w-md animate-rise text-balance text-ink-muted"
            style={{ animationDelay: "580ms" }}
          >
            Sign in and you are one click from a container with a real shell, a
            real filesystem and a public URL.
          </p>

          <dl
            className="mt-8 hidden w-full max-w-md animate-rise grid-cols-3 gap-px overflow-hidden rounded-md border border-edge bg-edge sm:grid"
            style={{ animationDelay: "660ms" }}
          >
            {FACTS.map(([k, v]) => (
              <div key={k} className="bg-canvas/85 px-3 py-2.5 text-left">
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-subtle">{k}</dt>
                <dd className="mt-1 text-xs text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Form */}
        <section
          className="mx-auto w-full max-w-sm animate-rise lg:mx-0 lg:justify-self-end"
          style={{ animationDelay: "250ms" }}
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-xl border border-brand/35 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-brand)_12%,transparent)_0_1px,transparent_1px_8px)]"
            />
            <div className="relative rounded-xl border border-edge-strong bg-surface/85 p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] backdrop-blur-md sm:p-8">
              <BorderBeam size={110} duration={8} />
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-subtle">
                  session / new
                </span>
                <span className="grid grid-cols-3 gap-[3px]" aria-hidden="true">
                  {Array.from({ length: 9 }, (_, i) => (
                    <span
                      key={i}
                      className={i % 2 === 0 ? "size-1.5 rounded-[1px] bg-brand" : "size-1.5 rounded-[1px] bg-edge-strong"}
                    />
                  ))}
                </span>
              </div>
              <h2 className="mt-6 font-display text-2xl font-medium tracking-[-0.02em] text-ink">
                Sign in
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                Spin up a containerised dev environment in your browser.
              </p>
              <div className="mt-6">
                <LoginButton />
              </div>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-ink-subtle">
            By continuing you agree to the{" "}
            Terms of Service and{" "}
            <Link href="/privacy" className="underline decoration-edge-strong underline-offset-2 hover:text-ink">
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
