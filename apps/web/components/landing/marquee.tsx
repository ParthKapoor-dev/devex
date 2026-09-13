import { cn } from "@/lib/utils";
import s from "./landing.module.css";

/**
 * The sliding strip under the hero: the product's facts, one breath each.
 *
 * A server component and pure CSS — the list is rendered twice and the track
 * translates by exactly half its width, so the loop is seamless and costs a
 * single composited transform. Hover pauses it; reduced motion stops it (the
 * first copy is then simply a static, masked row).
 *
 * The second copy is `aria-hidden`, so a screen reader hears the list once.
 */

const FACTS = [
  "Node.js & Python templates",
  "Open source",
  "Self-host on your cluster",
  "Monaco editor",
  "A real PTY terminal",
  "Public URL for any port",
  "Files persist to S3",
  "MCP server for agents",
  "Kubernetes native",
];

const MASK = "linear-gradient(to right, transparent, black 10%, black 90%, transparent)";

export default function Marquee() {
  return (
    <section
      aria-label="DevEx at a glance"
      className={cn(s.marqueeHost, "relative overflow-hidden border-y border-edge py-5")}
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      <ul className={s.marquee}>
        {[0, 1].map((copy) =>
          FACTS.map((fact) => (
            <li
              key={`${copy}-${fact}`}
              aria-hidden={copy === 1 || undefined}
              className="flex shrink-0 items-center gap-8 pr-8 font-display text-2xl tracking-tight text-ink-muted sm:text-3xl"
            >
              {fact}
              <span aria-hidden="true" className="text-lg text-brand">
                ✳
              </span>
            </li>
          )),
        )}
      </ul>
    </section>
  );
}
