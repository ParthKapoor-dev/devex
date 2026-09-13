"use client";

import dynamic from "next/dynamic";
import { Play } from "lucide-react";
import { VideoReveal } from "@/components/mocks/video-reveal";
import { GRAIN } from "./hero";

// MOCK — the demo, framed in a bezel of the same molten chrome as the hero.

const Chrome = dynamic(() => import("./chrome"), { ssr: false });

export default function MoltenDemo() {
  return (
    <section id="demo" className="scroll-mt-24 px-4 pb-10 pt-28 sm:px-6 sm:pt-40">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 grid gap-6 sm:mb-14 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="label mb-5 flex items-center gap-3 text-ink-subtle">
              <span className="text-brand">01</span>
              <span className="h-px w-8 bg-edge-strong" />
              The demo
            </p>
            <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] font-medium leading-[0.95] tracking-[-0.045em] text-ink">
              Sign in. Click.
              <br />
              <span className="text-ink-subtle">You&rsquo;re in a shell.</span>
            </h2>
          </div>
          <p className="max-w-xs text-pretty text-sm leading-relaxed text-ink-muted lg:pb-3">
            From the login screen to a running container with Monaco, a
            terminal and a public URL, in one take.
          </p>
        </div>

        {/* Bezel: chrome shows through a 6px ring around the video. */}
        <div className="relative isolate">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-10 -bottom-16 top-1/2 -z-10 bg-[radial-gradient(50%_60%_at_50%_60%,color-mix(in_oklab,var(--color-brand)_22%,transparent),transparent_70%)] blur-2xl"
          />
          <div className="relative overflow-hidden rounded-[1.5rem] p-1.5 sm:rounded-[2.25rem] sm:p-2.5">
            <Chrome renderScale={0.3} speed={0.3} interactive={false} baseColor={[0.13, 0.068, 0.012]} />
            <VideoReveal
              label="Play the DevEx demo"
              className="relative aspect-video w-full rounded-[calc(1.5rem-6px)] bg-canvas sm:rounded-[calc(2.25rem-10px)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://i.ytimg.com/vi/Tlck20bJeFE/maxresdefault.jpg"
                alt=""
                className="size-full object-cover opacity-50 blur-[1px] grayscale transition-[transform,opacity,filter] duration-700 ease-[--ease-out-expo] group-hover:scale-[1.03] group-hover:opacity-70 group-hover:blur-0"
              />
              {/* Tint the old poster frame into the palette. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_80%_at_70%_20%,var(--color-brand-700),var(--color-brand-950)_60%,var(--color-canvas))] mix-blend-color"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,color-mix(in_oklab,var(--color-canvas)_85%,transparent),transparent_55%)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.12] mix-blend-overlay"
                style={{ backgroundImage: GRAIN }}
              />
              {/* Static play disc for touch; the cursor label takes over on hover. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-brand-fg shadow-[0_0_0_10px_color-mix(in_oklab,var(--color-brand)_20%,transparent)] transition-[opacity,transform] duration-300 ease-[--ease-out-expo] group-hover:scale-75 group-hover:opacity-0 sm:size-24"
              >
                <Play className="ml-1 size-6 fill-current sm:size-8" />
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-8 sm:bottom-7"
              >
                <span className="font-display text-lg font-medium tracking-tight text-ink sm:text-3xl">
                  Workspace, zero to live
                </span>
                <span className="label hidden text-ink-muted sm:block">
                  youtube · plays here
                </span>
              </span>
            </VideoReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
