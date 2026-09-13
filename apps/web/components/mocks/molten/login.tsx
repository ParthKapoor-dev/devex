"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { LoginButton } from "@/components/Auth/LoginButton";
import { token } from "@/lib/tokens";
import { GRAIN } from "./hero";

// MOCK — Molten login: dot grid field, a card with a molten brand band on top.

const Chrome = dynamic(() => import("./chrome"), { ssr: false });
const DotGrid = dynamic(() => import("@/components/mocks/dot-grid"), { ssr: false });

const ERRORS: Record<string, string> = {
  session_error: "Your session expired. Try signing in again.",
  invalid_state: "That sign-in link did not match this browser session. Start again from this page.",
  exchange_failed: "GitHub did not complete the handshake. Try again.",
  user_fetch_failed: "Signed in, but your GitHub profile could not be read.",
  session_save_failed: "Signed in, but the session could not be saved.",
};

function ErrorNote() {
  const code = useSearchParams().get("error");
  if (!code) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/8 p-3"
    >
      <AlertCircle className="mt-px size-4 shrink-0 text-danger" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-ink-muted">
        {ERRORS[code] ?? "Something went wrong signing in. Try again."}
      </p>
    </div>
  );
}

export default function MoltenLogin() {
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center px-4 pb-24 pt-28">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <DotGrid dotSize={3} gap={22} baseColor="#2a2a2a" /* MOCK: between raised and ink-subtle */ activeColor={token.brand500} proximity={140} />
        <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_50%,transparent_35%,var(--color-canvas)_100%)]" />
      </div>

      <div className="w-full max-w-[25rem] animate-rise">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-edge-strong bg-surface/85 shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(0_0_0/0.4)] backdrop-blur-xl">
          {/* Brand band */}
          <div className="relative h-40 overflow-hidden">
            <Chrome renderScale={1} speed={0.26} amplitude={0.3} frequencyX={1.5} frequencyY={1.8} baseColor={[0.1, 0.05, 0.008]} />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_30%,var(--color-surface)_100%)]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay"
              style={{ backgroundImage: GRAIN }}
            />
            <div className="absolute inset-x-6 bottom-4 flex items-end justify-between">
              <Link
                href="/mocks/molten"
                className="flex items-center gap-2.5 rounded-md font-display text-3xl font-medium tracking-[-0.04em] text-ink"
              >
                <Image src="/logo.png" alt="" width={28} height={28} className="drop-shadow-[0_2px_8px_rgb(0_0_0/0.6)]" />
                DevEx
              </Link>
              <span className="label pb-1.5 text-ink-muted">cloud ide</span>
            </div>
          </div>

          <div className="px-6 pb-6 pt-5 sm:px-7 sm:pb-7">
            <h1 className="font-display text-[1.75rem] font-medium leading-tight tracking-[-0.03em] text-ink">
              Sign in, get a machine.
            </h1>
            <p className="mb-6 mt-1.5 text-sm leading-relaxed text-ink-muted">
              A container with a real shell and a public URL, ready in seconds.
            </p>

            <Suspense fallback={null}>
              <ErrorNote />
            </Suspense>

            <LoginButton />
          </div>
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-ink-subtle">
          By continuing you agree to the Terms of Service and{" "}
          <Link href="/privacy" className="underline decoration-edge-strong underline-offset-2 hover:text-ink">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="label mt-3 text-center text-ink-subtle">
          k8s pod <span className="text-brand">/</span> real shell <span className="text-brand">/</span> persists to s3
        </p>
      </div>
    </main>
  );
}
