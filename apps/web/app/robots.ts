import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Previews and local runs must never be indexed, or they compete with
  // production for the same content.
  const isProduction = siteConfig.url.startsWith("https://");

  if (!isProduction) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Authenticated and ephemeral surfaces: no public content, and the
        // REPL routes are unbounded.
        disallow: ["/api/", "/dashboard", "/repl/", "/login", "/demo"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
