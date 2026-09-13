"use client";

import {
  SiDocker,
  SiGo,
  SiKubernetes,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiRedis,
  SiRust,
  SiTypescript,
} from "react-icons/si";
import { ScrollAssembleIcons } from "@/components/mocks/scroll-assemble";
import { AssembleText } from "./assemble";

// MOCK — the "not a playground" moment, what that means, and the stack.

const TRUTHS = [
  {
    k: "Shell",
    title: "A real shell",
    body: "A terminal into a Kubernetes pod. Install packages, run servers, kill processes. Nothing is simulated.",
  },
  {
    k: "Disk",
    title: "A real filesystem",
    body: "Your files live on disk, not in browser storage, and sync to S3 when you leave.",
  },
  {
    k: "Port",
    title: "A public URL",
    body: "Start a server and it is reachable at its own address. Share it, hit it from your phone.",
  },
  {
    k: "State",
    title: "Still there tomorrow",
    body: "Close the tab. Come back next week. The workspace resumes where you stopped.",
  },
];

const STACK = [
  { icon: SiGo, name: "Go" },
  { icon: SiNodedotjs, name: "Node.js" },
  { icon: SiTypescript, name: "TypeScript" },
  { icon: SiPython, name: "Python" },
  { icon: SiRust, name: "Rust" },
  { icon: SiDocker, name: "Docker" },
  { icon: SiKubernetes, name: "Kubernetes" },
  { icon: SiRedis, name: "Redis" },
  { icon: SiPostgresql, name: "PostgreSQL" },
  { icon: SiNextdotjs, name: "Next.js" },
];

export function NotAPlayground() {
  return (
    <section aria-label="Not a playground" className="relative">
      <AssembleText
        text="NOT A PLAYGROUND."
        className="h-[160vh]"
        charClassName="font-display text-[clamp(3rem,13vw,11rem)] font-medium leading-[0.88] tracking-[-0.05em] text-brand"
        eyebrow={
          <p className="label flex items-center gap-3 text-ink-subtle">
            <span className="text-brand">02</span>
            <span className="h-px w-8 bg-edge-strong" />
            What you actually get
          </p>
        }
      />

      <div className="mx-auto -mt-[20vh] max-w-6xl px-4 sm:px-6">
        <ul className="grid overflow-hidden rounded-[1.5rem] border border-edge sm:grid-cols-2 lg:grid-cols-4">
          {TRUTHS.map((t, i) => (
            <li
              key={t.k}
              className="group relative flex flex-col sm:min-h-60 border-edge bg-surface/40 p-6 not-last:border-b sm:p-7 sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:not-last:border-r"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[linear-gradient(90deg,var(--color-brand-600),var(--color-brand-300))] transition-transform duration-500 ease-[--ease-out-expo] group-hover:scale-x-100"
              />
              <span className="label flex items-center justify-between text-ink-subtle">
                <span>{t.k}</span>
                <span className="tabular-nums text-brand">0{i + 1}</span>
              </span>
              <h3 className="mt-auto pt-6 font-display sm:pt-10 text-2xl font-medium tracking-[-0.03em] text-ink">
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

export function Stack() {
  return (
    <section aria-label="Your stack" className="pt-16">
      <ScrollAssembleIcons icons={STACK} className="h-[160vh]" title="whatever your stack needs" />
    </section>
  );
}
