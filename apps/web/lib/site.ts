/**
 * Canonical facts about the site.
 *
 * Everything SEO-related (metadata, sitemap, robots, OG images, JSON-LD) reads
 * from here so there is exactly one place to change the domain or the pitch.
 *
 * `NEXT_PUBLIC_SITE_URL` must be set to the production origin in the deploy
 * environment — a wrong value here produces wrong canonical URLs, which is
 * worse for search than having none.
 */

const FALLBACK_URL = "http://localhost:3000";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  // Vercel sets this on preview and production deploys.
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return FALLBACK_URL;
}

export const siteConfig = {
  name: "DevEx",
  url: resolveSiteUrl(),

  /** ~60 chars — the usable width of a Google result title. */
  title: "DevEx — Open-source cloud development environments",

  /** ~155 chars — the usable width of a Google result snippet. */
  description:
    "Spin up containerised dev environments in your browser in seconds. Kubernetes-native, self-hostable REPLs with a real terminal, editor and persistent files.",

  tagline: "Your best developer experience, on the cloud.",

  keywords: [
    "cloud IDE",
    "cloud development environment",
    "online code editor",
    "Kubernetes REPL",
    "self-hosted IDE",
    "browser IDE",
    "containerised development",
    "open source Replit alternative",
    "remote development",
    "MCP server",
  ],

  author: {
    name: "Parth Kapoor",
    url: "https://parthkapoor.me",
  },

  repo: "https://github.com/parthkapoor-dev/devex",

  links: {
    github: "https://github.com/parthkapoor-dev/devex",
    docs: "/docs",
    call: "https://cal.com/parthkapoor",
  },

  /** Used for `twitter:creator`; leave empty to omit the tag. */
  twitter: "",
} as const;

export type SiteConfig = typeof siteConfig;

/** Absolute URL for a site-relative path. Required for canonical + OG tags. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, siteConfig.url).toString();
}
