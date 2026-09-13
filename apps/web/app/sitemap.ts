import type { MetadataRoute } from "next";
import { getDocs } from "@/lib/docs/source";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap.
 *
 * Only public, indexable content appears here. Authenticated routes
 * (`/dashboard`, `/repl/*`), the login flow and the API are excluded — they are
 * noindex or disallowed, and listing either in a sitemap is a contradiction
 * crawlers report as an error.
 *
 * Dates are when the content last changed, never the build time: a sitemap
 * whose every `lastmod` is "now" tells crawlers the whole site changed on every
 * deploy, and they learn to ignore the field. Docs take theirs from frontmatter
 * `updated`; the pages below are dated here — bump one when its copy changes.
 */
const UPDATED = {
  home: "2026-09-13",
  about: "2026-09-13",
  contact: "2026-09-13",
  privacy: "2026-09-13",
  ping: "2026-09-13",
} as const;
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(UPDATED.home),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/docs"),
      // The docs index changes when any doc does.
      lastModified: new Date(
        Math.max(...getDocs().map((doc) => Date.parse(doc.lastModified))),
      ),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: new Date(UPDATED.about),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: new Date(UPDATED.contact),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: new Date(UPDATED.privacy),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/ping"),
      lastModified: new Date(UPDATED.ping),
      changeFrequency: "daily",
      priority: 0.3,
    },
  ];

  const docRoutes: MetadataRoute.Sitemap = getDocs()
    .filter((doc) => !doc.frontmatter.draft && doc.slug.length > 0)
    .map((doc) => ({
      url: absoluteUrl(doc.url),
      lastModified: new Date(doc.lastModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  return [...staticRoutes, ...docRoutes];
}
