import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";

interface PageSeoInput {
  title?: string;
  description?: string;
  /** Site-relative path, e.g. `/docs/getting-started`. */
  path?: string;
  /** Override the OG image. Defaults to the route's generated image. */
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  /** Keep a page out of the index (login flows, ephemeral REPL routes). */
  noIndex?: boolean;
}

/**
 * Builds a complete, canonical-correct `Metadata` object for a page.
 *
 * Prefer this over hand-writing `metadata` per route — it guarantees every page
 * gets a canonical URL, an OG image and a Twitter card, which is where most of
 * the practical SEO value sits.
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image,
  type = "website",
  publishedTime,
  modifiedTime,
  noIndex = false,
}: PageSeoInput = {}): Metadata {
  const url = absoluteUrl(path);
  const resolvedTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.title;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      type,
      url,
      siteName: siteConfig.name,
      title: resolvedTitle,
      description,
      locale: "en_US",
      ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      ...(image ? { images: [image] } : {}),
      ...(siteConfig.twitter ? { creator: siteConfig.twitter } : {}),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* JSON-LD                                                                    */
/* -------------------------------------------------------------------------- */

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any (web-based)",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    sameAs: [siteConfig.repo],
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/logo.png"),
    sameAs: [siteConfig.repo, siteConfig.author.url],
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function techArticleJsonLd({
  title,
  description,
  path,
  modifiedTime,
}: {
  title: string;
  description: string;
  path: string;
  modifiedTime?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description,
    url: absoluteUrl(path),
    ...(modifiedTime ? { dateModified: modifiedTime } : {}),
    author: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/logo.png"),
      },
    },
    isPartOf: {
      "@type": "WebSite",
      name: `${siteConfig.name} Documentation`,
      url: absoluteUrl("/docs"),
    },
  };
}
