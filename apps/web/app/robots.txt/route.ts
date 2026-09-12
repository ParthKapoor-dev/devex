import {
  ANSWER_ENGINE_CRAWLERS,
  DISALLOWED_PATHS,
  TRAINING_ONLY_CRAWLERS,
} from "@/lib/agents";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * robots.txt.
 *
 * A route handler rather than Next's `app/robots.ts` metadata convention,
 * because `MetadataRoute.Robots` can only express user-agent / allow / disallow
 * / sitemap. It cannot emit `Content-Signal`, and it cannot emit comments —
 * and a robots.txt that says *why* it draws a line is the difference between a
 * policy and a list.
 *
 * The policy has three tiers:
 *
 *   1. Answer-engine crawlers get everything the public gets. Being cited in
 *      an answer is how anyone finds a project like this now.
 *   2. Training-only harvesters are refused. Not a position on training — they
 *      simply never send a reader back.
 *   3. Everything else gets the default rule.
 *
 * `Content-Signal` (contentsignals.org) states the same preference in the form
 * Cloudflare and a growing set of crawlers read, for the ones that ignore a
 * user-agent block they were not explicitly named in.
 */

export const dynamic = "force-static";

/**
 * Preview and local builds must never be indexed.
 *
 * Checked against `VERCEL_ENV`, not against whether the site URL looks like
 * production: `NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL` is the *production*
 * domain on every deploy including previews, so a URL sniff called every
 * preview production and invited crawlers into it.
 */
function isIndexable(): boolean {
  const vercelEnv = process.env.VERCEL_ENV;
  if (vercelEnv) return vercelEnv === "production";

  // Not on Vercel: fall back to the site URL, which is localhost unless
  // NEXT_PUBLIC_SITE_URL was set deliberately.
  return siteConfig.url.startsWith("https://");
}

function body(): string {
  if (!isIndexable()) {
    return [
      "# Not the production deployment. Nothing here should be indexed —",
      "# it competes with devx.parthkapoor.me for the same content.",
      "User-agent: *",
      "Disallow: /",
      "",
    ].join("\n");
  }

  const disallow = DISALLOWED_PATHS.map((path) => `Disallow: ${path}`);

  const lines: string[] = [
    `# ${siteConfig.name} — ${siteConfig.tagline}`,
    `# Source: ${siteConfig.repo}`,
    "#",
    "# Agent-readable index: /llms.txt",
    "# Full documentation:   /llms-full.txt",
    "# API description:      /openapi.json",
    "",
    "# Default policy. The disallowed paths are either authenticated, or one",
    "# URL per ephemeral workspace — there is no content behind them to read.",
    "User-agent: *",
    "Allow: /",
    ...disallow,
    "",
    "# Crawlers that feed answer engines. Same access as everyone else: being",
    "# quoted in an answer is how people find an open-source project now.",
    ...ANSWER_ENGINE_CRAWLERS.flatMap((agent) => [
      `User-agent: ${agent}`,
      "Allow: /",
      ...disallow,
      "",
    ]),
    "# Harvest-only crawlers. They take the bandwidth and cite nobody.",
    ...TRAINING_ONLY_CRAWLERS.flatMap((agent) => [
      `User-agent: ${agent}`,
      "Disallow: /",
      "",
    ]),
    "# Content Signals (contentsignals.org) — the same preference stated in",
    "# the form crawlers read when they were not named above.",
    "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `Host: ${siteConfig.url}`,
    "",
  ];

  return lines.join("\n");
}

export function GET(): Response {
  return new Response(body(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
