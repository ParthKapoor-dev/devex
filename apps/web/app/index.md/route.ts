import {
  AGENT_SUMMARY,
  API_ORIGIN,
  FAQ,
  WHEN_NOT_TO_USE,
  WHEN_TO_USE,
} from "@/lib/agents";
import { getSections } from "@/lib/docs/source";
import { PLANS, SELF_HOST_NOTE, SPEC_ROWS } from "@/lib/pricing";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { textResponse } from "@/lib/text-response";

/**
 * `/index.md` — the homepage, as markdown.
 *
 * The landing page is a canvas backdrop, an animated headline and three
 * sections of layout. Almost none of that survives being read as text, and an
 * agent that scrapes it gets a low ratio of meaning to markup. This is the
 * same information written for something that only reads.
 *
 * Every content route answers to a `.md` suffix; this is the one for `/`,
 * because `/.md` is not a URL.
 */

export const dynamic = "force-static";

function planTable(): string[] {
  const header = `| Plan | ${SPEC_ROWS.join(" | ")} | Price |`;
  const divider = `| --- | ${SPEC_ROWS.map(() => "---").join(" | ")} | --- |`;
  const rows = PLANS.map(
    (plan) =>
      `| ${plan.name} | ${plan.specs.join(" | ")} | ${plan.price === 0 ? "Free" : `$${plan.price}/mo`} |`,
  );
  return [header, divider, ...rows];
}

function body(): string {
  const docLinks = getSections().flatMap((section) => [
    `### ${section.title}`,
    "",
    ...section.docs.map(
      (doc) =>
        `- [${doc.frontmatter.title}](${absoluteUrl(doc.url)}) — ${doc.frontmatter.description}`,
    ),
    "",
  ]);

  return [
    `# ${siteConfig.name}`,
    "",
    AGENT_SUMMARY,
    "",
    `- Site: ${siteConfig.url}`,
    `- Source: ${siteConfig.repo} (MIT)`,
    `- API: ${API_ORIGIN}`,
    `- Author: ${siteConfig.author.name} — ${siteConfig.author.url}`,
    "",
    "## What a workspace is",
    "",
    "A workspace is one unprivileged pod on a Kubernetes cluster, started from a template. Inside it you get:",
    "",
    "- A shell. Not an emulator — bash in the container, with a package manager and outbound network.",
    "- A filesystem that persists. The tree is synced to S3-compatible object storage and restored on the next start.",
    "- A browser editor with the language tooling the template installed.",
    "- Public ports. A server you start in the terminal gets a URL anyone can open, with no tunnel to configure.",
    "",
    "## When to use DevEx",
    "",
    ...WHEN_TO_USE.map((line) => `- ${line}`),
    "",
    "### When something else is the better answer",
    "",
    ...WHEN_NOT_TO_USE.map((line) => `- ${line}`),
    "",
    "## Pricing",
    "",
    ...planTable(),
    "",
    SELF_HOST_NOTE,
    "",
    `Full table: ${absoluteUrl("/pricing.md")}`,
    "",
    "## Documentation",
    "",
    ...docLinks,
    "## For agents",
    "",
    `- \`${absoluteUrl("/llms.txt")}\` — index of everything below.`,
    `- \`${absoluteUrl("/llms-full.txt")}\` — the whole manual in one file.`,
    `- \`${absoluteUrl("/openapi.json")}\` — OpenAPI 3.1 description of the REST API.`,
    `- \`${absoluteUrl("/.well-known/ard.json")}\` — Agentic Resource Discovery catalogue.`,
    "- Any page: append `.md` to the path for this treatment.",
    "",
    "## Frequently asked",
    "",
    ...FAQ.flatMap(({ question, answer }) => [`### ${question}`, "", answer, ""]),
  ].join("\n");
}

export function GET(): Response {
  return textResponse(body(), "text/markdown");
}
