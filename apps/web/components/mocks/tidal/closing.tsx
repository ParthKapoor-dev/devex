import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WaveField } from "./wave-field";

/** MOCK — bookend to the hero: the tide comes back in. */
export function TidalClosing() {
  return (
    <section className="relative isolate overflow-hidden px-5 sm:px-8 lg:px-12">
      <WaveField
        mask="linear-gradient(to bottom, transparent 0%, black 45%, black 80%, transparent 100%)"
        lineColor="rgba(254, 154, 0, 0.3)"
      />
      <div className="relative mx-auto max-w-[1440px] border-t border-edge pt-4 pb-28 sm:pb-40">
        <div className="flex justify-between">
          <span className="label text-ink-muted">
            N° 07 <span className="text-ink-subtle">— Begin</span>
          </span>
          <span className="label text-ink-subtle">End of drawing</span>
        </div>
        <div className="mt-20 grid gap-10 lg:mt-28 lg:grid-cols-12 lg:items-end">
          <h2 className="font-display text-[clamp(3.5rem,12vw,10rem)] font-medium leading-[0.88] tracking-[-0.055em] text-ink lg:col-span-8">
            Open a <span className="text-gradient-brand">tab.</span>
          </h2>
          <div className="flex flex-col gap-5 lg:col-span-4 lg:border-l lg:border-edge lg:pl-8">
            <p className="max-w-sm leading-relaxed text-ink-muted">
              Two workspaces on the Free plan. No card, no install, no local
              setup to break.
            </p>
            <Link
              href="/login"
              className="group inline-flex h-12 w-fit items-center gap-2 rounded-md bg-brand px-6 font-medium text-brand-fg transition-[filter,transform] duration-[--duration-fast] hover:brightness-110 active:scale-[0.98]"
            >
              Start a workspace
              <ArrowRight className="size-4 transition-transform duration-[--duration-normal] group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
