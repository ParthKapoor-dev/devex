import Link from "next/link";
import { ArrowUpRight, Bot, Server } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { Section } from "./section";

/**
 * The two things that separate this from a hosted-only IDE: you can run the
 * whole thing yourself, and an AI assistant can use a workspace too.
 *
 * Each cell ends in a real terminal snippet, because "self-hostable" is only a
 * claim until someone shows the first command. The MCP cell is worded to what
 * the server does today; the docs carry the detail.
 *
 * A server component.
 */

const CELLS = [
  {
    icon: Server,
    title: "Self-host it on your cluster",
    body: "MIT-licensed, Kubernetes-native and provider-agnostic. One public node, an S3-compatible bucket and Redis are enough — no cloud load balancer required.",
    // Real commands against files that exist in infra/k8s.
    code: [
      "$ git clone " + siteConfig.repo.replace("https://", ""),
      "$ helm install traefik traefik/traefik \\",
      "    -f infra/k8s/traefik-values.yaml",
      "$ kubectl apply -f infra/k8s/cert-issuer-production.yaml",
    ],
    href: "/docs/self-hosting",
    cta: "Self-hosting guide",
  },
  {
    icon: Bot,
    title: "Give an AI agent a real machine",
    body: "An optional MCP server can run beside each workspace, so an assistant reads the same files you are working on instead of guessing at them. Early, and growing.",
    // The server's live tools today are Ping and read_file; show the real one.
    code: [
      '→ tools/call read_file {"path":"src/index.ts"}',
      '← import { serve } from "./server"',
      "  const port = 3000 …",
    ],
    href: "/docs/mcp",
    cta: "MCP server docs",
  },
];

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
      <div className="grid gap-4 lg:grid-cols-2">
        {CELLS.map(({ icon: Icon, title, body, code, href, cta }) => (
          <article
            key={title}
            className="group flex flex-col rounded-xl border border-edge bg-surface/50 p-6 transition-colors duration-[--duration-normal] hover:border-edge-strong sm:p-7"
          >
            <Icon className="size-5 text-brand" aria-hidden="true" />
            <h3 className="mt-5 font-display text-xl font-medium tracking-[-0.02em] text-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            <pre className="mt-6 overflow-x-auto rounded-md border border-term-edge bg-term-bg px-4 py-3 font-mono text-[11px] leading-relaxed text-term-ink sm:text-xs">
              {code.join("\n")}
            </pre>
            <Link
              href={href}
              className="mt-5 inline-flex items-center gap-1 self-start text-sm text-ink transition-colors duration-[--duration-fast] hover:text-brand"
            >
              {cta}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}
