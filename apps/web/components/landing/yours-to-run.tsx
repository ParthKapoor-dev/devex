import Link from "next/link";
import { ArrowRight, Bot, Server } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";
import { Section } from "./section";

/**
 * The two things that separate this from a hosted-only IDE: you can run the
 * whole thing yourself, and an AI assistant can use a workspace too.
 *
 * Each cell ends in a small terminal window, because "self-hostable" is only
 * a claim until someone shows the first command. Lines carry a tone so the
 * prompt, the command and the reply read apart at a glance. The MCP cell is
 * worded to what the server does today; the docs carry the detail.
 *
 * On phones the cells drop their card chrome and become two plain blocks
 * split by a rule — a stack of bordered boxes is what made mobile feel boxy.
 *
 * A server component.
 */

type Line = { tone: "cmd" | "cont" | "req" | "res"; text: string };

const CELLS: {
  icon: typeof Server;
  kicker: string;
  title: string;
  body: string;
  shell: string;
  code: Line[];
  href: string;
  cta: string;
}[] = [
  {
    icon: Server,
    kicker: "Self-host",
    title: "Run it on your own cluster",
    body: "MIT-licensed and provider-agnostic. A Kubernetes cluster with one public node, an S3-compatible bucket and Redis is enough — no cloud load balancer.",
    shell: "~/devex",
    // Real commands against files that exist in infra/k8s.
    code: [
      { tone: "cmd", text: "git clone " + siteConfig.repo.replace("https://", "") },
      { tone: "cmd", text: "helm install traefik traefik/traefik \\" },
      { tone: "cont", text: "  -f infra/k8s/traefik-values.yaml" },
      { tone: "cmd", text: "kubectl apply -f infra/k8s/cert-issuer-production.yaml" },
    ],
    href: "/docs/self-hosting",
    cta: "Self-hosting guide",
  },
  {
    icon: Bot,
    kicker: "MCP",
    title: "Give an AI agent a real machine",
    body: "Turn on the MCP sidecar and an assistant can read the files in a workspace — the same ones open in your editor — instead of guessing at them. It exposes read_file today; more tools are planned.",
    shell: "mcp · /mcp/<repl-id>",
    // The server's live tools today are Ping and read_file; show the real one.
    code: [
      { tone: "req", text: 'tools/call read_file {"path": "src/index.ts"}' },
      { tone: "res", text: 'import { serve } from "./server"' },
      { tone: "res", text: "const port = 3000" },
    ],
    href: "/docs/mcp",
    cta: "MCP server docs",
  },
];

const PREFIX: Record<Line["tone"], { mark: string; className: string }> = {
  cmd: { mark: "$", className: "text-term-ink" },
  cont: { mark: " ", className: "text-term-muted" },
  req: { mark: "→", className: "text-brand-200" },
  res: { mark: "←", className: "text-term-muted" },
};

export default function YoursToRun() {
  return (
    <Section
      id="open-source"
      n="05"
      eyebrow="Open source"
      title={
        <>
          Yours to run, <span className="text-ink-subtle">and your agent&rsquo;s to use.</span>
        </>
      }
    >
      <div className="grid gap-x-5 gap-y-12 lg:grid-cols-2 lg:gap-y-5">
        {CELLS.map(({ icon: Icon, kicker, title, body, shell, code, href, cta }, i) => (
          <article
            key={title}
            className={cn(
              // `min-w-0`: a grid item is as wide as its widest child by
              // default, and the snippet below would push the cell off-screen.
              "group flex min-w-0 flex-col",
              "sm:rounded-2xl sm:border sm:border-edge sm:bg-surface/40 sm:p-8 sm:transition-colors sm:duration-[--duration-normal] sm:hover:border-edge-strong",
              i > 0 && "max-sm:border-t max-sm:border-edge max-sm:pt-12",
            )}
          >
            <p className="label flex items-center gap-2.5 text-brand">
              <Icon className="size-4" aria-hidden="true" />
              {kicker}
            </p>
            <h3 className="mt-4 text-balance font-display text-2xl font-medium tracking-[-0.03em] text-ink">
              {title}
            </h3>
            <p className="mt-3 max-w-[52ch] text-pretty text-[15px] leading-relaxed text-ink-muted">{body}</p>

            {/* A terminal window. `mt-auto` bottom-aligns the two windows
                when the cells sit side by side. */}
            <div className="mt-auto pt-7">
              <div className="overflow-hidden rounded-lg border border-term-edge bg-term-bg">
                <div className="flex items-center gap-3 border-b border-term-edge px-3.5 py-2">
                  <span aria-hidden="true" className="flex gap-1.5">
                    <span className="size-2 rounded-full bg-term-edge" />
                    <span className="size-2 rounded-full bg-term-edge" />
                    <span className="size-2 rounded-full bg-term-edge" />
                  </span>
                  <span className="truncate font-mono text-[11px] text-term-muted">{shell}</span>
                </div>
                <pre className="overflow-x-auto px-3.5 py-3.5 font-mono text-xs leading-[1.8]">
                  {code.map((line, n) => (
                    <span key={n} className="block whitespace-pre">
                      <span
                        aria-hidden="true"
                        className={cn("mr-2.5 select-none", line.tone === "req" ? "text-brand" : "text-term-muted")}
                      >
                        {PREFIX[line.tone].mark}
                      </span>
                      <span className={PREFIX[line.tone].className}>{line.text}</span>
                    </span>
                  ))}
                </pre>
              </div>
            </div>

            <Link
              href={href}
              className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-medium text-ink transition-colors duration-[--duration-fast] hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {cta}
              <ArrowRight
                className="size-3.5 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
