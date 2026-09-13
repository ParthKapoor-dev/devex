import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/site";
import { FAQ } from "@/lib/agents";
import { PLANS } from "@/lib/pricing";

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

/**
 * The JSON-LD graph.
 *
 * One `@graph`, not a pile of unrelated nodes. Every node has a stable `@id`
 * built from the site origin and refers to the others by that `@id`, which is
 * the difference between "here are four facts about something" and "here is an
 * entity". An answer engine working out whether the DevEx that runs Kubernetes
 * containers is the same DevEx as the GitHub repository resolves it from these
 * links, not from the prose.
 *
 * `sameAs` is the other half of that: the identities this project already has
 * elsewhere, so the entity can be matched rather than guessed at.
 */

/** Stable node identifiers. Never change these — they are the entity keys. */
const ID = {
  organization: absoluteUrl("/#organization"),
  website: absoluteUrl("/#website"),
  software: absoluteUrl("/#software"),
  faq: absoluteUrl("/#faq"),
} as const;

export function organizationJsonLd() {
  return {
    "@type": "Organization",
    "@id": ID.organization,
    name: siteConfig.name,
    alternateName: "devX",
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/logo.png"),
      caption: `${siteConfig.name} logo`,
    },
    description: siteConfig.description,
    foundingDate: "2025",
    founder: {
      "@type": "Person",
      name: siteConfig.author.name,
      url: siteConfig.author.url,
    },
    // An open-source project run by one person: the honest contacts are the
    // issue tracker and a booking link, not a support desk that does not
    // exist. `contactType` says which of the two you want.
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "technical support",
        url: `${siteConfig.repo}/issues`,
        availableLanguage: "English",
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        url: siteConfig.links.call,
        availableLanguage: "English",
      },
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "IN",
    },
    sameAs: [
      siteConfig.repo,
      siteConfig.author.url,
      "https://github.com/parthkapoor-dev",
    ],
  };
}

export function webSiteJsonLd() {
  return {
    "@type": "WebSite",
    "@id": ID.website,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    inLanguage: "en",
    publisher: { "@id": ID.organization },
    // The docs search is a real route, so this is a claim we can keep.
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/docs?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@type": "SoftwareApplication",
    "@id": ID.software,
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "DeveloperApplication",
    applicationSubCategory: "Cloud development environment",
    operatingSystem: "Any (web-based)",
    browserRequirements: "Requires JavaScript and WebSocket support.",
    softwareHelp: { "@type": "CreativeWork", url: absoluteUrl("/docs") },
    featureList: [
      "Containerised development environments on Kubernetes",
      "Browser terminal attached to a real shell",
      "Filesystem persisted to object storage across restarts",
      "Public port forwarding without a tunnel",
      "Model Context Protocol server for AI agents",
      "Self-hostable, MIT",
    ],
    // One Offer per plan, so an agent comparing products reads the numbers
    // rather than parsing an animated pricing table. Same source as the page.
    offers: PLANS.map((plan) => ({
      "@type": "Offer",
      name: `${siteConfig.name} ${plan.name}`,
      description: plan.summary,
      price: plan.price.toFixed(2),
      priceCurrency: "USD",
      category: plan.price === 0 ? "free" : "subscription",
      url: absoluteUrl("/#pricing"),
      availability: "https://schema.org/InStock",
      ...(plan.price > 0
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: plan.price.toFixed(2),
              priceCurrency: "USD",
              unitCode: "MON",
              billingDuration: 1,
            },
          }
        : {}),
    })),
    isAccessibleForFree: true,
    license: `${siteConfig.repo}/blob/main/LICENSE`,
    author: { "@id": ID.organization },
    publisher: { "@id": ID.organization },
    sameAs: [siteConfig.repo],
  };
}

export function softwareSourceCodeJsonLd() {
  return {
    "@type": "SoftwareSourceCode",
    "@id": `${siteConfig.repo}#source`,
    name: `${siteConfig.name} source`,
    description:
      "The whole stack: a Next.js web app, a Go control plane, a Go runner inside each workspace, and an MCP server.",
    codeRepository: siteConfig.repo,
    programmingLanguage: ["Go", "TypeScript"],
    runtimePlatform: "Kubernetes",
    license: `${siteConfig.repo}/blob/main/LICENSE`,
    author: { "@id": ID.organization },
    about: { "@id": ID.software },
  };
}

export function faqJsonLd() {
  return {
    "@type": "FAQPage",
    "@id": ID.faq,
    mainEntity: FAQ.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/**
 * The homepage graph: everything above, linked, in one script tag.
 *
 * A single `@graph` rather than an array of standalone documents — the nodes
 * refer to each other by `@id`, and a parser that reads them separately loses
 * exactly the links that make them an entity.
 */
export function siteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      webSiteJsonLd(),
      softwareApplicationJsonLd(),
      softwareSourceCodeJsonLd(),
      faqJsonLd(),
    ],
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
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
    "@type": "TechArticle",
    "@id": `${absoluteUrl(path)}#article`,
    headline: title,
    description,
    url: absoluteUrl(path),
    ...(modifiedTime ? { dateModified: modifiedTime } : {}),
    // By `@id`, not by value. The organization is fully described on the
    // homepage; repeating a partial copy here would give a parser two
    // Organization nodes to reconcile instead of one to look up.
    author: { "@id": ID.organization },
    publisher: { "@id": ID.organization },
    isPartOf: { "@id": ID.website },
    // A markdown twin of this page exists, and saying so is what lets an
    // agent fetch prose instead of scraping the rendered article.
    encoding: {
      "@type": "MediaObject",
      encodingFormat: "text/markdown",
      contentUrl: `${absoluteUrl(path)}.md`,
    },
  };
}

/**
 * The per-page graph for a documentation route: the article, its breadcrumb
 * trail, and the two nodes they point at.
 *
 * The organization and website nodes are repeated here rather than assumed,
 * because a crawler that lands directly on a docs page never sees the
 * homepage's script — and an `@id` reference to a node that is not in the
 * document resolves to nothing.
 */
export function docJsonLd(
  article: Parameters<typeof techArticleJsonLd>[0],
  trail: { name: string; path: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationJsonLd(),
      webSiteJsonLd(),
      techArticleJsonLd(article),
      breadcrumbJsonLd(trail),
    ],
  };
}
