import { cn } from "@/lib/utils";
import { AssembleText } from "./assemble";
import { Eyebrow } from "./section";
import s from "./landing.module.css";

/**
 * "Not a playground" — the claim, then what it means.
 *
 * The phrase assembles as you scroll into it, and the four cells underneath
 * cash it out: each one names a thing a browser playground fakes and this
 * does not. They are the product's four promises, so they sit directly under
 * the claim rather than in a feature list further down.
 *
 * The cells are a server-rendered grid; only the headline is a client island.
 */

const TRUTHS = [
  {
    k: "Shell",
    title: "A real shell",
    body: "A PTY into your own container. Install packages, run servers, background jobs, Ctrl-C — nothing is simulated.",
  },
  {
    k: "Disk",
    title: "A real filesystem",
    body: "Your files live on the container's disk, not in browser storage, and sync to S3 when the workspace stops.",
  },
  {
    k: "Port",
    title: "A public URL",
    body: "Start a server on any port and it is reachable from the internet. Share it, hit it from your phone, point a webhook at it.",
  },
  {
    k: "State",
    title: "Still there tomorrow",
    body: "Close the tab and the pod's resources go back to the cluster. Come back next week and your files are exactly where you left them.",
  },
];

export default function NotAPlayground() {
  return (
    <section aria-labelledby="not-a-playground" className="relative">
      <h2 id="not-a-playground" className="sr-only">
        Not a playground
      </h2>
      <AssembleText
        text="NOT A PLAYGROUND."
        className="-mt-[28vh] h-[140vh]"
        charClassName={cn(
          s.glow,
          "font-display text-[clamp(2.6rem,11vw,8.5rem)] font-semibold leading-[0.9] tracking-[-0.045em] text-brand",
        )}
        before={<Eyebrow n="01">What you actually get</Eyebrow>}
      />

      <div className="mx-auto -mt-[22vh] max-w-6xl px-4 sm:px-6">
        <ul className="grid overflow-hidden rounded-2xl border border-edge bg-canvas/60 backdrop-blur-[2px] sm:grid-cols-2 lg:grid-cols-4">
          {TRUTHS.map((t, i) => (
            <li
              key={t.k}
              className="group relative flex flex-col border-edge p-6 not-last:border-b sm:min-h-60 sm:p-7 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:not-last:border-r"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,var(--color-brand-600),var(--color-brand-300))] transition-transform duration-500 ease-[--ease-out-expo] group-hover:scale-x-100"
              />
              <span className="label flex items-center justify-between text-ink-subtle">
                <span>{t.k}</span>
                <span className="tabular-nums text-brand">0{i + 1}</span>
              </span>
              <h3 className="mt-auto pt-6 font-display text-2xl font-medium tracking-[-0.03em] text-ink sm:pt-10">
                {t.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
