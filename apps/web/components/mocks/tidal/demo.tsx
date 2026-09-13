"use client";

import { Play } from "lucide-react";
import { VideoReveal } from "@/components/mocks/video-reveal";

/** Duotone the (pre-rebrand, green) YouTube poster into the amber palette. */
function PlateFace() {
  return (
    <span className="absolute inset-0 block overflow-hidden rounded-[inherit]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://i.ytimg.com/vi/Tlck20bJeFE/maxresdefault.jpg"
        alt=""
        className="size-full object-cover opacity-70 contrast-125 grayscale transition-transform duration-700 ease-[--ease-out-expo] group-hover:scale-[1.03]"
      />
      <span aria-hidden="true" className="absolute inset-0 bg-brand mix-blend-multiply" />
      <span
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, var(--color-canvas) 0%, color-mix(in oklab, var(--color-canvas) 40%, transparent) 45%, transparent 75%)",
        }}
      />
      <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 sm:p-8 lg:p-10">
        <span className="font-display text-2xl font-medium leading-none tracking-[-0.04em] text-ink sm:text-5xl lg:text-6xl">
          Watch it run.
        </span>
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand text-brand-fg transition-transform duration-[--duration-slow] ease-[--ease-spring] group-hover:scale-110 sm:size-20">
          <Play className="size-5 translate-x-px fill-current sm:size-7" aria-hidden="true" />
        </span>
      </span>
    </span>
  );
}

/** MOCK — Skiper 67 video, framed like a plate in a technical book. */
export function TidalDemo() {
  return (
    <section id="demo" className="scroll-mt-24 px-5 sm:px-8 lg:px-12" aria-labelledby="tidal-demo">
      <div className="mx-auto max-w-[1440px] border-t border-edge pt-4">
        <div className="flex justify-between">
          <span className="label text-ink-muted">
            N° 03 <span className="text-ink-subtle">— The demo</span>
          </span>
          <span className="label text-ink-subtle">Fig. C</span>
        </div>

        <div className="mt-14 grid gap-8 lg:mt-20 lg:grid-cols-12 lg:items-end">
          <h2
            id="tidal-demo"
            className="text-balance font-display text-4xl font-medium leading-[0.98] tracking-[-0.045em] text-ink sm:text-6xl lg:col-span-7 lg:text-7xl"
          >
            From sign-in to a running server, <span className="text-ink-subtle">without leaving the tab.</span>
          </h2>
          <p className="max-w-md leading-relaxed text-ink-muted lg:col-span-4 lg:col-start-9">
            Pick a template, open the editor, start a dev server in the
            terminal and share its URL. Click the plate to play it.
          </p>
        </div>

        <div className="relative mt-12 lg:mt-16">
          <VideoReveal
            label="Play the DevEx demo"
            className="aspect-video w-full rounded-xl border border-edge-strong bg-surface"
          >
            <PlateFace />
          </VideoReveal>
          {/* Plate corner ticks */}
          <div aria-hidden="true" className="pointer-events-none absolute -inset-2 hidden sm:block">
            {[
              "left-0 top-0 border-l border-t",
              "right-0 top-0 border-r border-t",
              "bottom-0 left-0 border-b border-l",
              "bottom-0 right-0 border-b border-r",
            ].map((c) => (
              <span key={c} className={`absolute size-4 border-brand/70 ${c}`} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <span className="label text-ink-subtle">Plate 1 · DevEx, end to end</span>
            <span className="label text-ink-subtle">Esc to close</span>
          </div>
        </div>
      </div>
    </section>
  );
}
