import type { Metadata } from "next";
import { DotWordmark } from "@/components/brand/dot-wordmark";
import { AsciiSweep } from "@/components/effects/ascii-sweep";
import { Blaze } from "@/components/effects/blaze";
import { buildMetadata } from "@/lib/seo";
import { token } from "@/lib/tokens";

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
  { prefix: "$", text: "devex start --template node api", colour: token.ink },
  { prefix: "[ok]", text: "template copied · s3://…/you/api/          0.4s" },
  { prefix: "[ok]", text: "deployment · service · ingress · applied   0.2s" },
  { prefix: "[ok]", text: "pod running · files restored              12.8s" },
  { prefix: "[ok]", text: "pty attached · websocket                   0.6s" },
  { prefix: "✓", text: "running in 14s — editor, shell and ports are live", colour: token.ink },
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
        Three effects, all of them shipped.
      </h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">
        Every one is written here rather than installed — the originals are
        either licensed in a way that a public MIT repo cannot take, or they
        need a browser flag to work at all. Each panel is the same component
        the site uses, at a size you can actually look at.
      </p>

      <Panel
        n="01"
        title="Dot wordmark"
        verdict="canvas 2d · ~0 kB · closing band"
        note="The logo’s X over the word, rasterised into an offscreen mask and read back one dot at a time. Coverage becomes dot area rather than opacity, so an edge dot is a smaller square and the X’s diagonals dither instead of stair-stepping. The refresh line runs parallel to the logo’s backslash stroke, so that arm lights all at once and the mark draws itself; behind it, dots cool through amber and drift off their cells until the line comes round again."
      >
        <div className="rounded-lg border border-edge bg-canvas p-10">
          <DotWordmark className="mx-auto aspect-[72/87] w-64" />
        </div>
      </Panel>

      <Panel
        n="02"
        title="ASCII sweep"
        verdict="canvas 2d · ~2 kB · section 06"
        note="A band crosses the text and dissolves what it touches through a glyph ramp. The original needs WebGL2 plus Chrome's HTML-in-Canvas origin trial to do this to arbitrary live markup; run it on strings we already have and it is a monospace grid on a 2D canvas — same gesture, two thousand cells instead of two million pixels. The real text stays in the DOM underneath for screen readers and find-in-page."
      >
        <div className="overflow-hidden rounded-lg border border-edge bg-term-bg p-6">
          <AsciiSweep lines={TRANSCRIPT} fontSize={13} mode="loop" />
        </div>
      </Panel>

      <Panel
        n="03"
        title="Blaze"
        verdict="webgl · 0 new kB · footer"
        note="One fragment shader on the ogl already in the tree, built to the shape of the original — which is not a wall of flame and has no flame field in it at all. It is four sheets of embers on a rising lattice, each one orbiting its own cell and lighting and going out at its own height; three octaves of domain-warped smoke that also eats the sheets behind it, which is where the depth comes from; and a glow on the edge they rise off. The original refracts the page’s own DOM through the heat, which needs Chrome’s html-in-canvas origin trial — so here the content is lit instead: the canvas sits above the text under mix-blend-screen, where black is a no-op and only light lands. It can wash text warm; it can never cover it."
      >
        <div className="relative overflow-hidden rounded-lg border border-edge bg-canvas">
          <div className="relative flex h-80 flex-col items-center justify-end gap-3 p-10">
            <p className="font-display text-4xl font-medium text-ink">
              Nothing to install.
            </p>
            <p className="font-mono text-xs text-ink-subtle">
              the text is under the fire, not behind it
            </p>
          </div>
          <Blaze
            className="absolute inset-x-0 bottom-0 z-10 h-72 mix-blend-screen"
            sparkDensity={1.15}
            sparkSize={1.5}
            glow={1.25}
            sparks={1.15}
            smoke={0.35}
          />
        </div>
      </Panel>
    </div>
  );
}
