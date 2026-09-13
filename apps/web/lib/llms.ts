import "server-only";

import {
  AGENT_SUMMARY,
  API_ORIGIN,
  FAQ,
  WHEN_NOT_TO_USE,
  WHEN_TO_USE,
} from "@/lib/agents";
import { getDocs, getSections } from "@/lib/docs/source";
import { PLANS } from "@/lib/pricing";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * The llms.txt family.
 *
 * `llms.txt` is the navigation index — what this is, when to reach for it, and
 * links to everything else. `llms-full.txt` is the whole manual inlined, for a
 * client that would rather make one request than twelve. `/docs/llms.txt` is
 * the same index scoped to the documentation.
 *
 * All three are generated from the same sources the site itself renders from,
 * so a doc added under `content/docs/` appears in every one of them with no
 * second edit. See llmstxt.org for the format.
 */

function link(path: string, label: string, note: string): string {
  return `- [${label}](${absoluteUrl(path)}): ${note}`;
}

/** The "when to use this" block. Shared by llms.txt and the markdown twins. */
export function whenToUseSection(): string {
  return [
    "## When to use DevEx",
    "",
    ...WHEN_TO_USE.map((line) => `- ${line}`),
    "",
    "### When something else is the better answer",
    "",
    ...WHEN_NOT_TO_USE.map((line) => `- ${line}`),
  ].join("\n");
}

/** `/llms.txt` — the index. */
export function llmsIndex(): string {
  const docs = getDocs().filter((doc) => !doc.frontmatter.draft);

  const docSections = getSections().map((section) => {
    const entries = section.docs.map((doc) =>
      link(doc.url, doc.frontmatter.title, doc.frontmatter.description),
    );
    return `## ${section.title}\n\n${entries.join("\n")}`;
  });

  const free = PLANS.find((plan) => plan.price === 0);

  return [
    `# ${siteConfig.name}`,
    "",
    `> ${AGENT_SUMMARY}`,
    "",
    whenToUseSection(),
    "",
    "## Start here",
    "",
    link("/", "Homepage", siteConfig.description),
    link("/docs", "Documentation", "Every guide, from first workspace to self-hosting."),
    link("/docs/quickstart", "Quickstart", "A running workspace in about a minute."),
    link("/pricing", "Pricing", `Plans and limits.${free ? ` The free tier gives ${free.specs[0]} workspaces at ${free.specs[1]} CPU and ${free.specs[2]} memory each, no card.` : ""}`),
    "",
    "## API and integration",
    "",
    `- [REST API](${API_ORIGIN}): Public origin. \`GET /ping\` and \`GET /auth/status\` need no credentials; workspace routes use a session cookie.`,
    link("/openapi.json", "OpenAPI 3.1 description", "Every endpoint, typed, with operation IDs suitable for function calling."),
    link("/docs/mcp", "MCP server", "Exposes a live workspace to an assistant as listFiles, readFile, writeFile and runCommand tools."),
    link("/.well-known/api-catalog", "API catalogue", "RFC 9727 linkset pointing at the service descriptions."),
    "",
    "## Machine-readable copies",
    "",
    link("/llms-full.txt", "llms-full.txt", "This index plus the full text of every documentation page, in one file."),
    link("/docs/llms.txt", "/docs/llms.txt", "The same index, scoped to the documentation."),
    link("/index.md", "index.md", "The homepage as markdown. Every page has a `.md` twin at the same path."),
    link("/pricing.md", "pricing.md", "Plans, limits and prices as markdown."),
    link("/sitemap.xml", "sitemap.xml", `All ${docs.length + 5} public URLs.`),
    "",
    ...docSections.flatMap((section) => [section, ""]),
    "## Frequently asked",
    "",
    ...FAQ.flatMap(({ question, answer }) => [`**${question}**`, "", answer, ""]),
    "## Project",
    "",
    `- [Source](${siteConfig.repo}): MIT. The whole stack — web app, Go control plane, runner and MCP server.`,
    `- [Author](${siteConfig.author.url}): ${siteConfig.author.name}.`,
    "",
  ].join("\n");
}

/** `/docs/llms.txt` — the documentation, scoped. */
export function llmsDocsIndex(): string {
  const sections = getSections().map((section) => {
    const entries = section.docs.map((doc) =>
      link(doc.url, doc.frontmatter.title, doc.frontmatter.description),
    );
    return `## ${section.title}\n\n${entries.join("\n")}`;
  });

  return [
    `# ${siteConfig.name} documentation`,
    "",
    `> Every guide for ${siteConfig.name}: getting a workspace running, how the control plane and runner fit together, the template format, the MCP server, and self-hosting the whole thing on your own cluster.`,
    "",
    "Each page below also answers to a `.md` suffix — `/docs/quickstart.md` returns the same page as markdown.",
    "",
    ...sections.flatMap((section) => [section, ""]),
    "## Elsewhere",
    "",
    link("/llms.txt", "Site index", "The same thing for the whole site, including the API."),
    link("/llms-full.txt", "Full text", "Every page below, inlined."),
    "",
  ].join("\n");
}

/** `/llms-full.txt` — the index followed by every page in full. */
export function llmsFull(): string {
  const docs = getDocs().filter((doc) => !doc.frontmatter.draft);

  const bodies = docs.map((doc) =>
    [
      "---",
      "",
      `# ${doc.frontmatter.title}`,
      "",
      `Source: ${absoluteUrl(doc.url)}`,
      `Last updated: ${doc.lastModified.slice(0, 10)}`,
      "",
      doc.frontmatter.description,
      "",
      doc.markdown,
      "",
    ].join("\n"),
  );

  return [llmsIndex(), "", ...bodies].join("\n");
}
