/**
 * What this site tells an agent about itself.
 *
 * `lib/site.ts` holds the facts a *person* needs — the title, the pitch, the
 * links. This file holds the facts a *program* needs: which crawlers may read
 * us, what the product is for, which jobs it is the right tool for, and where
 * the machine-readable surfaces live.
 *
 * Everything agent-facing reads from here — robots.txt, llms.txt, the
 * `/.well-known` catalogues, the markdown twins — so there is one place to
 * change the story and no way for two of them to disagree.
 *
 * The audit that grades all of this is `npx ax audit devx.parthkapoor.me`;
 * re-run it after frontend changes. See the checklist in AGENTS-AUDIT.md.
 */

// Relative, not aliased: next.config.ts imports this file to build the Link
// header, and the config is loaded before the tsconfig path aliases apply.
import { absoluteUrl, siteConfig } from "./site";

/* -------------------------------------------------------------------------- */
/* Crawler policy                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Crawlers that feed answer engines — the ones that put us in a reply when
 * someone asks "how do I get a cloud dev environment". These get everything
 * the public gets, because being cited is the entire point.
 */
export const ANSWER_ENGINE_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Amazonbot",
  "Bingbot",
  "DuckAssistBot",
  "MistralAI-User",
  "cohere-ai",
  "ora-agent",
] as const;

/**
 * Crawlers that only harvest for model training and cite nobody. Disallowed —
 * not out of principle about training, but because they take the bandwidth
 * without ever sending a reader back.
 */
export const TRAINING_ONLY_CRAWLERS = [
  "CCBot",
  "Bytespider",
  "ByteSpider",
  "Diffbot",
  "omgili",
  "omgilibot",
  "Timpibot",
  "Webzio-Extended",
] as const;

/**
 * Paths no crawler should follow.
 *
 * `/repl/` is unbounded — one URL per workspace per user, all of them
 * authenticated and all of them gone within the day. The rest is either behind
 * a session or a redirect target with no content of its own.
 */
export const DISALLOWED_PATHS = [
  "/api/",
  "/dashboard",
  "/repl/",
  "/login",
  "/demo",
] as const;

/* -------------------------------------------------------------------------- */
/* The brief                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * One paragraph, no marketing. This is the blockquote at the top of llms.txt
 * and the summary in every discovery document.
 */
export const AGENT_SUMMARY =
  "DevEx runs containerised development environments on Kubernetes and puts them in a browser tab. " +
  "Each workspace is a real Linux container: a shell, a filesystem that survives a restart, a code editor, " +
  "and ports reachable over the public internet. It is open source (Apache-2.0) and self-hostable.";

/**
 * When an agent should reach for DevEx, and when it should not.
 *
 * The audit calls this the "when to use" signal and it is the one section that
 * cannot be filled with product copy — a list of jobs, in the words someone
 * would actually use to describe the job, plus the cases where the honest
 * answer is "use something else".
 */
export const WHEN_TO_USE: readonly string[] = [
  "You need to run or verify code that you wrote, not just print it — DevEx gives you a shell with a real package manager and network access.",
  "A reproducible environment matters more than local setup: the container is defined by a template, so everyone lands on the same toolchain.",
  "You want to hand someone a running thing, not a repository — every workspace can expose a port on a public URL.",
  "Work needs to survive the session. Files are persisted to object storage and restored when the workspace starts again.",
  "You are building an AI coding tool and need the agent to execute what it writes — the MCP server exposes the workspace filesystem and shell as tools.",
];

export const WHEN_NOT_TO_USE: readonly string[] = [
  "You need a GPU, privileged containers, or Docker-in-Docker. Workspaces are unprivileged pods with CPU and memory limits.",
  "You want a hosted production runtime. Workspaces are development containers and are reclaimed when idle.",
  "You only need to evaluate a snippet with no filesystem or network. A plain sandbox API is cheaper and faster.",
];

/**
 * Questions people actually ask before signing up, answered in one paragraph
 * each. Feeds the FAQPage JSON-LD and the markdown twins.
 */
export const FAQ: readonly { question: string; answer: string }[] = [
  {
    question: "What is DevEx?",
    answer:
      "DevEx is an open-source cloud development environment. It schedules a container on Kubernetes and gives you a browser tab with a code editor, a terminal attached to that container's shell, and a file tree backed by persistent storage.",
  },
  {
    question: "Is DevEx free?",
    answer:
      "The Free plan costs nothing and needs no card: two workspaces, 125m CPU and 256Mi memory each, 200MB persisted. Self-hosting is free without limits — the source is Apache-2.0 licensed and the deployment is documented.",
  },
  {
    question: "Do my files survive a restart?",
    answer:
      "Yes. A workspace's filesystem is synced to S3-compatible object storage and restored when the workspace starts again, so stopping one does not lose work.",
  },
  {
    question: "Can I reach a server running inside a workspace?",
    answer:
      "Yes. Ports opened inside the container are forwarded to a public URL, so a dev server or an API you started in the terminal is reachable from anywhere without a tunnel.",
  },
  {
    question: "Can an AI agent use a DevEx workspace?",
    answer:
      "Yes. The DevEx MCP server exposes a live workspace over the Model Context Protocol with listFiles, readFile, writeFile and runCommand tools, so an assistant can run the code it writes and read the error instead of guessing.",
  },
  {
    question: "Can I self-host DevEx?",
    answer:
      "Yes. DevEx needs a Kubernetes cluster, a Redis instance and an S3-compatible bucket. The self-hosting guide covers the manifests, the environment variables and the runner image.",
  },
];

/* -------------------------------------------------------------------------- */
/* Machine-readable surfaces                                                  */
/* -------------------------------------------------------------------------- */

/** The origin the REST API is actually served from. Public, no key required. */
export const API_ORIGIN =
  process.env.NEXT_PUBLIC_CORE_API_URL?.replace(/\/$/, "") ||
  "https://api.devx.parthkapoor.me";

/**
 * Every machine-readable document this site publishes.
 *
 * One list, used by the `Link:` response headers, the RFC 9727 API catalogue
 * and the ARD manifest — so adding a surface means adding one entry here.
 */
export const AGENT_SURFACES: readonly {
  path: string;
  rel: string;
  type: string;
  title: string;
}[] = [
  {
    path: "/llms.txt",
    rel: "alternate",
    type: "text/plain",
    title: "llms.txt index",
  },
  {
    path: "/llms-full.txt",
    rel: "alternate",
    type: "text/plain",
    title: "Full documentation as plain text",
  },
  {
    path: "/index.md",
    rel: "alternate",
    type: "text/markdown",
    title: "Homepage as markdown",
  },
  {
    path: "/openapi.json",
    rel: "service-desc",
    type: "application/json",
    title: "OpenAPI 3.1 description of the DevEx REST API",
  },
  {
    path: "/.well-known/api-catalog",
    rel: "api-catalog",
    type: 'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
    title: "API catalogue (RFC 9727)",
  },
  {
    path: "/sitemap.xml",
    rel: "sitemap",
    type: "application/xml",
    title: "Sitemap",
  },
];

/**
 * The `Link:` header value advertising all of the above. RFC 8288.
 *
 * The media type is truncated at the first `;`. A full type can carry its own
 * quoted parameters — the API catalogue's is
 * `application/linkset+json;profile="…"` — and nesting those quotes inside the
 * header's own `type="…"` produces a value no parser reads correctly. The
 * parameters belong on the document's `Content-Type`, which is where they are.
 */
export function linkHeaderValue(): string {
  return AGENT_SURFACES.map(({ path, rel, type }) => {
    const bareType = type.split(";")[0].trim();
    return `<${absoluteUrl(path)}>; rel="${rel}"; type="${bareType}"`;
  }).join(", ");
}

/** Convenience: the site name and origin, for documents that open with them. */
export const AGENT_IDENTITY = {
  name: siteConfig.name,
  origin: siteConfig.url,
  repository: siteConfig.repo,
  license: "Apache-2.0",
  licenseUrl: `${siteConfig.repo}/blob/main/LICENSE`,
} as const;
