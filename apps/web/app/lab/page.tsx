import type { Metadata } from "next";
import { DotWordmark } from "@/components/brand/dot-wordmark";
import { AsciiSweep } from "@/components/effects/ascii-sweep";
import { EmberField } from "@/components/effects/ember-field";
import { GlassObject } from "@/components/effects/glass-object";
import { buildMetadata } from "@/lib/seo";

/**
 * A scratch page for judging effects before any of them touch the site.
 *
 * Not linked from anywhere and not indexed. Each panel says what the thing is,
 * what it would cost and where it might go, so the decision is about whether
 * it looks good — everything else is already answered.
 *
 * Delete this route once the calls are made.
 */
export const metadata: Metadata = buildMetadata({
  title: "Lab",
  description: "Scratch page for effects under consideration.",
  path: "/lab",
  noIndex: true,
});

const TRANSCRIPT = [
  "$ devex start --template node api",
  "[ ok ] template copied · s3://…/you/api/          0.4s",
  "[ ok ] deployment · service · ingress · applied   0.2s",
  "[ ok ] pod running · files restored              12.8s",
  "[ ok ] pty attached · websocket                   0.6s",
  "✓ running in 14s — editor, shell and ports are live",
];

function Panel({
  n,
  title,
  note,
  verdict,
  children,
}: {
  n: string;
  title: string;
  note: string;
  verdict: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-edge py-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 className="flex items-center gap-3 font-display text-xl font-medium text-ink">
          <span className="inline-grid h-5 min-w-5 place-items-center rounded-[3px] bg-brand px-1 font-mono text-[10px] text-brand-fg">
            {n}
          </span>
          {title}
        </h2>
        <p className="font-mono text-xs text-ink-subtle">{verdict}</p>
      </div>
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-ink-muted">
        {note}
      </p>
      {children}
    </section>
  );
}

export default function Lab() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-24">
      <p className="label text-ink-subtle">Scratch · not linked, not indexed</p>
      <h1 className="mt-4 font-display text-4xl font-medium tracking-[-0.03em] text-ink">
        Four effects, none of them shipped.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">
        Every one is written here rather than installed. The originals are
        either licensed in a way that a public MIT repo cannot take, or they
        want a second WebGL context, or both. Move the pointer over each.
      </p>

      <Panel
        n="01"
        title="Dot wordmark"
        verdict="canvas 2d · ~0 kB · in use"
        note="The 5×7 mark supersampled 3× and halftoned — coverage becomes dot area, so the edges break up instead of stair-stepping. A sweep crosses on a diagonal and the dots it passes swell and warm. This is the one already on the landing page, rebuilt: the first attempt drew one square per font cell, which is a pixel font, not a dither."
      >
        <div className="rounded-lg border border-edge bg-canvas p-10">
          <DotWordmark className="mx-auto h-28 w-full max-w-lg" />
        </div>
      </Panel>

      <Panel
        n="02"
        title="ASCII sweep"
        verdict="canvas 2d · ~2 kB · unplaced"
        note="A band crosses the text and dissolves what it touches through a glyph ramp. The original needs WebGL2 plus Chrome's HTML-in-Canvas origin trial to do this to arbitrary live markup; run it on strings we already have and it is a monospace grid on a 2D canvas — same gesture, two thousand cells instead of two million pixels. The real text stays in the DOM underneath for screen readers and find-in-page."
      >
        <div className="overflow-hidden rounded-lg border border-edge bg-term-bg p-6">
          <AsciiSweep lines={TRANSCRIPT} fontSize={13} />
        </div>
      </Panel>

      <Panel
        n="03"
        title="Embers"
        verdict="canvas 2d · ~1 kB · unplaced"
        note="Blaze, read conservatively. Not flames — a page that looks like it is burning is the wrong metaphor for “a real machine, one tab away”, and a full fire shader would blow the accent budget on its own. Sparse points rising and going out, which is the part of fire a near-neutral page can carry. Count scales with area and caps, so a wide monitor does not quietly cost more."
      >
        <div className="relative overflow-hidden rounded-lg border border-edge bg-canvas">
          <EmberField className="absolute inset-0" />
          <div className="relative flex h-64 flex-col items-center justify-center gap-3">
            <p className="font-display text-2xl font-medium text-ink">
              Nothing to install.
            </p>
            <p className="font-mono text-xs text-ink-subtle">
              this is what it would look like behind the closing call to action
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        n="04"
        title="Glass"
        verdict="webgl · 0 new kB · needs a decision"
        note="One fragment shader on the ogl already in the tree. Because the backdrop is procedural there is nothing to screenshot: the shader evaluates it twice, once straight and once at a refracted coordinate, so the refraction is real rather than a blur. Dispersion is a fraction of a pixel — an iridescent object would be the loudest thing on a zero-chroma page — and the accent is spent on the rim. The original is three.js plus five addons, roughly 190–210 kB gzipped, for one object."
      >
        <GlassObject className="h-80 w-full rounded-lg border border-edge" />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-subtle">
          Note: on this page it owns its own WebGL context. To put it in the
          hero it would have to be folded into the CRT&rsquo;s context and
          refract the shader itself — which is the only reason to want glass
          there. That is real work in <code className="font-mono">crt-shader.tsx</code>,
          so it is worth doing only if you like this.
        </p>
      </Panel>
    </div>
  );
}
