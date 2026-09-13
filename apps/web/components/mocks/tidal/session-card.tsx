"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// MOCK — an illustrative workspace, not a live one. Limits are the Free plan's.
const START = 4 * 60 + 12;

function useUptime() {
  const [s, setS] = useState(START);
  useEffect(() => {
    const id = window.setInterval(() => setS((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function SessionCard({ className }: { className?: string }) {
  const uptime = useUptime();

  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-lg border border-edge-strong bg-surface/80 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] backdrop-blur-md",
        className,
      )}
      aria-label="Example workspace session"
    >
      <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
        <span className="label text-ink-subtle">Session</span>
        <span className="label inline-flex items-center gap-2 text-brand">
          <span className="size-1.5 animate-pulse-ring rounded-full bg-brand" />
          Running
        </span>
      </div>

      <div className="px-4 pt-4 pb-3">
        <p className="font-display text-lg font-medium tracking-tight text-ink">
          api-playground
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 font-mono text-xs">
          <dt className="text-ink-subtle">template</dt>
          <dd className="text-ink-muted">node</dd>
          <dt className="text-ink-subtle">limits</dt>
          <dd className="text-ink-muted">125m cpu · 256Mi</dd>
          <dt className="text-ink-subtle">uptime</dt>
          <dd className="tabular-nums text-ink" suppressHydrationWarning>
            {uptime}
          </dd>
        </dl>
      </div>

      <div className="flex items-center gap-2 border-t border-edge bg-canvas/60 px-4 py-2.5 font-mono text-xs">
        <span className="rounded-xs border border-edge-strong px-1.5 py-px text-ink">
          :3000
        </span>
        <span className="text-ink-subtle" aria-hidden="true">
          →
        </span>
        <span className="min-w-0 truncate text-brand">
          a7f2.repl.devx.parthkapoor.me
        </span>
        <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
      </div>
    </figure>
  );
}
