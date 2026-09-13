import styles from "./tidal.module.css";
import { cn } from "@/lib/utils";

/** MOCK — real numbers from lib/pricing (Free plan) and the MCP server's tool list. */
const STATS = [
  { value: "2", unit: "workspaces", note: "Free, no card" },
  { value: "256", unit: "Mi memory", note: "per workspace, 125m CPU" },
  { value: "200", unit: "MB persisted", note: "synced to S3" },
  { value: "4", unit: "MCP tools", note: "list · read · write · run" },
];

const FACTS = [
  "Monaco editor",
  "xterm.js shell",
  "Persists to S3",
  "Public URL per port",
  "MCP server for agents",
  "Kubernetes native",
  "Node.js & Python templates",
  "Open source",
  "Self-host on your cluster",
];

export function SpecStrip() {
  return (
    <section className="px-5 sm:px-8 lg:px-12" aria-label="DevEx at a glance">
      <div className="mx-auto max-w-[1440px]">
        <dl className="grid grid-cols-2 border-b border-edge lg:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.unit}
              className={cn(
                "flex flex-col gap-2 py-8 pr-4 sm:py-10",
                i % 2 === 1 && "border-l border-edge pl-4 sm:pl-8",
                i >= 2 && "border-t border-edge lg:border-t-0",
                i === 2 && "lg:border-l lg:pl-8",
              )}
            >
              <dt className="label order-last text-ink-subtle">{s.note}</dt>
              <dd className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-2">
                <span className="font-display text-5xl font-medium tracking-[-0.04em] text-ink sm:text-6xl">
                  {s.value}
                </span>
                <span className="font-mono text-sm text-ink-muted">{s.unit}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div
        className={cn(
          styles.marqueeHost,
          "relative -mx-5 overflow-hidden border-b border-edge py-5 sm:-mx-8 lg:-mx-12",
        )}
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
        }}
      >
        <ul className={styles.marquee} aria-label="Features">
          {[0, 1].map((copy) =>
            FACTS.map((f) => (
              <li
                key={`${copy}-${f}`}
                aria-hidden={copy === 1 || undefined}
                className="flex shrink-0 items-center gap-8 pr-8 font-display text-2xl tracking-tight text-ink-muted sm:text-3xl"
              >
                {f}
                <span className="text-lg text-brand" aria-hidden="true">
                  ✳
                </span>
              </li>
            )),
          )}
        </ul>
      </div>
    </section>
  );
}
