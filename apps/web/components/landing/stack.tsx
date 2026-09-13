// Client: the icon components are passed as props to the scroll island, and
// functions cannot cross the server/client boundary.
"use client";

import {
  SiBun,
  SiDjango,
  SiFastapi,
  SiGo,
  SiNextdotjs,
  SiNodedotjs,
  SiPostgresql,
  SiPython,
  SiRust,
  SiTypescript,
} from "react-icons/si";
import { AssembleIcons } from "./assemble";
import { Eyebrow } from "./section";

/**
 * What you can run.
 *
 * Honest about the split: the templates are Node.js and Python, and
 * everything else is a real Linux shell away. The icons are languages and
 * tools you install *inside* a workspace — Docker and Kubernetes are left off
 * on purpose, because a workspace runs on Kubernetes but cannot run either.
 */

const STACK = [
  { icon: SiNodedotjs, name: "Node.js" },
  { icon: SiTypescript, name: "TypeScript" },
  { icon: SiNextdotjs, name: "Next.js" },
  { icon: SiBun, name: "Bun" },
  { icon: SiGo, name: "Go" },
  { icon: SiRust, name: "Rust" },
  { icon: SiPython, name: "Python" },
  { icon: SiFastapi, name: "FastAPI" },
  { icon: SiDjango, name: "Django" },
  { icon: SiPostgresql, name: "PostgreSQL" },
];

export default function Stack() {
  return (
    <section aria-labelledby="stack-title" className="-mb-[22vh] -mt-[18vh]">
      <AssembleIcons
        icons={STACK}
        before={
          <div className="flex flex-col items-center gap-5 text-center">
            <Eyebrow n="04">Your stack</Eyebrow>
            <h2
              id="stack-title"
              className="flex items-center gap-2 whitespace-nowrap font-display text-[clamp(1.15rem,5.2vw,3.25rem)] sm:gap-3 font-medium tracking-[-0.035em] text-ink"
            >
              <Bracket className="h-[1.3em] text-brand" />
              whatever your stack needs
              <Bracket className="h-[1.3em] -scale-x-100 text-brand" />
            </h2>
          </div>
        }
        after={
          <p className="max-w-md text-balance text-center text-sm leading-relaxed text-ink-muted">
            Start from the <span className="text-ink">Node.js</span> or{" "}
            <span className="text-ink">Python</span> template. It is a real
            Linux container, so the rest is one install away.
          </p>
        }
      />
    </section>
  );
}

function Bracket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 27 78" fill="currentColor" className={className} aria-hidden="true">
      <path d="M26.52 77.21h-5.75c-6.83 0-12.38-5.56-12.38-12.38V48.38C8.39 43.76 4.63 40 .01 40v-4c4.62 0 8.38-3.76 8.38-8.38V12.4C8.38 5.56 13.94 0 20.77 0h5.75v4h-5.75c-4.62 0-8.38 3.76-8.38 8.38V27.6c0 4.34-2.25 8.17-5.64 10.38 3.39 2.21 5.64 6.04 5.64 10.38v16.45c0 4.62 3.76 8.38 8.38 8.38h5.75v4.02Z" />
    </svg>
  );
}
