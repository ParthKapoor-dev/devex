import type { MetadataRoute } from "next";
import { getDocs } from "@/lib/docs/source";
import { absoluteUrl } from "@/lib/site";

/**
 * Sitemap.
 *
 * Only public, indexable content appears here. Authenticated routes
 * (`/dashboard`, `/repl/*`), the login flow and the API are excluded — they are
 * also disallowed in robots.ts, and listing a disallowed URL in a sitemap is a
 * contradiction crawlers report as an error.
 *
 * `lastModified` comes from the last git commit touching each MDX file, not the
 * filesystem mtime, which in CI is just the checkout time for every file.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: absoluteUrl("/docs"),
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/about"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: absoluteUrl("/contact"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/ping"),
      lastModified: new Date(),
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
