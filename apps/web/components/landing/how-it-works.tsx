import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { VideoReveal } from "./video-reveal";
import { Eyebrow } from "./section";
import { cn } from "@/lib/utils";
import s from "./landing.module.css";

/**
 * What happens between the click and the prompt — and the demo, kept small.
 *
 * The four steps are the real mechanism, with the real objects named in each
 * trace line: for this audience a trace does more than another adjective. The
 * recorded demo sits beside them as a compact card rather than a section of
 * its own; it is supporting evidence, not the pitch.
 *
 * A server component. The only client island is the video card.
 */

const STEPS = [
  {
    at: "0s",
    title: "You pick a template",
    body: "Core copies the Node.js or Python template into object storage under your account and records the workspace.",
    trace: "POST /api/repl/new  →  s3://…/<you>/<id>/",
  },
  {
    at: "~0.2s",
    title: "Kubernetes takes over",
    body: "A Deployment, a Service and an Ingress are applied. The scheduler places the pod; the runner image is usually already cached on the node.",
    trace: "apply deploy · svc · ingress  →  Pending",
  },
  {
    at: "10–20s",
    title: "The runner attaches",
    body: "The container pulls your files down and forks a PTY. Your browser connects over WebSockets straight to it, through the Ingress.",
    trace: "wss://…/<id>  →  pty attached · fs synced",
  },
  {
    at: "on stop",
    title: "Your work syncs back",
    body: "Changed files are pushed to storage and the pod's CPU and memory go back to the cluster. Nothing runs while you are away.",
    trace: "diff → s3 put  →  resources released",
  },
] as const;

export default function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-24 px-4 sm:px-6">
      <div className="mx-auto grid max-w-5xl gap-12 border-t border-edge py-20 sm:py-28 lg:grid-cols-[7fr_5fr] lg:gap-16">
        <div>
          <Eyebrow n="03">How it works</Eyebrow>
          <h2
            id="how-title"
            className="mt-5 text-balance font-display text-3xl font-medium tracking-[-0.035em] text-ink sm:text-4xl"
          >
            A pod, a PTY and a bucket.
          </h2>
          <p className="mt-4 max-w-xl text-balance leading-relaxed text-ink-muted">
            No image build on the critical path and no VM to wait for. Four
            things happen between the click and the prompt, and none of them
            are yours to manage.
          </p>

          <ol className="mt-10 flex flex-col">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className={cn(
                  "group grid grid-cols-[4.5rem_1fr] gap-4 py-5",
                  i > 0 && "border-t border-edge",
                )}
              >
                <span className="pt-0.5 font-mono text-xs tabular-nums text-brand">{step.at}</span>
                <div className="min-w-0">
                  <h3 className="font-medium text-ink">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{step.body}</p>
                  <code className="mt-3 block overflow-x-auto whitespace-pre rounded-xs border-l-2 border-edge bg-term-bg px-3 py-2 font-mono text-[11px] leading-relaxed text-term-muted transition-colors duration-[--duration-normal] group-hover:border-brand group-hover:text-term-ink">
                    {step.trace}
                  </code>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* The demo: a card, sticky beside the steps on desktop. */}
        <aside id="demo" aria-label="Product demo" className="scroll-mt-28 lg:pt-[4.25rem]">
          <div className="lg:sticky lg:top-28">
            <div className="relative">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-xl border border-brand/40 bg-[repeating-linear-gradient(135deg,color-mix(in_oklab,var(--color-brand)_14%,transparent)_0_1px,transparent_1px_9px)]"
              />
              <VideoReveal
                label="Play the DevEx demo"
                className="aspect-video w-full rounded-xl border border-edge-strong bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://i.ytimg.com/vi/Tlck20bJeFE/mqdefault.jpg"
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    s.poster,
                    "size-full object-cover transition-[transform,filter] duration-700 ease-[--ease-out-expo] group-hover:scale-[1.04] group-hover:filter-none",
                  )}
                />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas/90 via-canvas/10 to-transparent" />
                <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-md bg-brand text-brand-fg shadow-[0_8px_30px_-6px_var(--color-brand-600)] transition-transform duration-300 group-hover:scale-110">
                    <svg viewBox="0 0 16 16" className="ml-0.5 size-3.5 fill-current" aria-hidden="true">
                      <path d="M4 2.5v11l9.5-5.5z" />
                    </svg>
                  </span>
                  <span className="font-display text-sm font-medium text-ink">Watch the demo</span>
                </span>
              </VideoReveal>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-ink-muted">
              A walkthrough from sign-in to a running server — creating a
              workspace, editing, the terminal and a public URL.
            </p>
            <Link
              href="/docs/architecture"
              className="mt-3 inline-flex items-center gap-1 text-sm text-ink transition-colors duration-[--duration-fast] hover:text-brand"
            >
              Read the architecture
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
