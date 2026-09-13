"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

/**
 * The frame for the sign-in flow: a wave panel on the left, the form on flat
 * canvas on the right. On narrow screens the panel becomes a short band above
 * the form.
 *
 * **Built to be fast.** The form is plain server-renderable markup and is on
 * screen before any script runs; the wave field is the only animated thing,
 * and it is a lazily-loaded 2D canvas capped at 30fps and DPR 1.5 that pauses
 * when the tab is hidden and draws one still frame under reduced motion. No
 * WebGL, no blur, nothing layered over the form.
 *
 * The left panel is not decoration only: it tells a first-time visitor what
 * happens after they sign in, which is the one question a login page leaves
 * unanswered.
 */

const Waves = dynamic(() => import("@/components/backgrounds/waves"), { ssr: false });

const NEXT = [
  ["01", "Sign in", "GitHub, or a magic link by email."],
  ["02", "Pick a template", "Node.js or Python — your files live in S3."],
  ["03", "Get a machine", "Editor, shell and a public URL in 10–20s."],
] as const;

const MASK = "linear-gradient(to bottom, transparent 0%, black 30%, black 100%)";

export function LoginShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-dvh bg-canvas lg:grid-cols-[1.05fr_1fr]">
      {/* Wave panel */}
      <section
        aria-label="What happens next"
        className="relative isolate flex min-h-64 flex-col overflow-hidden border-b border-edge px-5 pb-6 pt-24 sm:px-8 lg:min-h-dvh lg:border-b-0 lg:border-r lg:px-12 lg:pb-12 lg:pt-28"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 animate-fade-in [animation-duration:900ms]"
          style={{ maskImage: MASK, WebkitMaskImage: MASK }}
        >
          <Waves
            lineColor="rgba(254, 154, 0, 0.36)"
            waveSpeedX={0.0105}
            waveSpeedY={0.004}
            waveAmpX={38}
            waveAmpY={18}
            xGap={12}
            yGap={36}
            fps={30}
            maxDpr={1.5}
          />
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklab, var(--color-canvas) 92%, transparent) 0%, transparent 60%)",
          }}
        />

        <div className="mt-auto">
          <p className="font-display text-[clamp(2.25rem,8vw,3.75rem)] font-medium leading-[0.95] tracking-[-0.05em] text-ink xl:text-[5rem]">
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="block animate-line-rise">Your dev box,</span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <span className="block animate-line-rise text-brand" style={{ animationDelay: "90ms" }}>
                one tab away.
              </span>
            </span>
          </p>

          <ol className="mt-10 hidden border-t border-edge sm:grid sm:grid-cols-3 lg:mt-12">
            {NEXT.map(([n, head, body], i) => (
              <li
                key={n}
                className="animate-rise border-edge py-4 pr-4 sm:[&:not(:first-child)]:border-l sm:[&:not(:first-child)]:pl-4"
                style={{ animationDelay: `${200 + i * 70}ms` }}
              >
                <span className="font-mono text-[11px] tabular-nums text-brand">{n}</span>
                <p className="mt-2 text-sm font-medium text-ink">{head}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Form */}
      <section className="flex flex-col px-5 py-12 sm:px-8 lg:px-12 lg:pb-10 lg:pt-28">
        <div className="mx-auto my-auto w-full max-w-sm animate-rise">
          {eyebrow ? (
            <p className="label mb-4 inline-flex items-center gap-2 text-ink-subtle">{eyebrow}</p>
          ) : null}
          <h1 className="font-display text-4xl font-medium tracking-[-0.04em] text-ink">{title}</h1>
          {subtitle ? <p className="mb-8 mt-2 leading-relaxed text-ink-muted">{subtitle}</p> : null}

          {children}

          {footer ? <div className="mt-8 text-xs leading-relaxed text-ink-subtle">{footer}</div> : null}
        </div>

        <div className="mx-auto mt-10 flex w-full max-w-sm items-center justify-between border-t border-edge pt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle lg:mx-0 lg:max-w-none">
          <span>Open source · MIT</span>
          <Link href="/" className="transition-colors duration-[--duration-fast] hover:text-ink">
            ← Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
