import { describe, expect, it } from "vitest";
import {
  buildMetadata,
  docJsonLd,
  homeJsonLd,
  siteJsonLd,
} from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

describe("buildMetadata", () => {
  it("uses an absolute title with the site name as suffix", () => {
    const metadata = buildMetadata({ title: "About", path: "/about" });
    expect(metadata.title).toEqual({ absolute: `About — ${siteConfig.name}` });
  });

  it("honours a custom title suffix", () => {
    const metadata = buildMetadata({ title: "Quickstart", titleSuffix: "DevEx docs" });
    expect(metadata.title).toEqual({ absolute: "Quickstart — DevEx docs" });
  });

  it("falls back to the site title when no title is given", () => {
    expect(buildMetadata().title).toEqual({ absolute: siteConfig.title });
  });

  it("builds the canonical URL from the path", () => {
    const metadata = buildMetadata({ path: "/docs/quickstart" });
    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/docs/quickstart"));
    expect(String(metadata.alternates?.canonical)).toMatch(/^https?:\/\//);
  });

  it("always sets the default OG and Twitter image", () => {
    const metadata = buildMetadata({ title: "Privacy", path: "/privacy" });
    const og = metadata.openGraph as { images: { url: string }[]; url: string };
    expect(og.images).toHaveLength(1);
    expect(og.images[0].url).toBe("/opengraph-image");
    expect(og.url).toBe(absoluteUrl("/privacy"));
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      images: ["/opengraph-image"],
    });
  });

  it("marks noIndex pages as not indexed but still followed", () => {
    expect(buildMetadata({ noIndex: true }).robots).toEqual({
      index: false,
      follow: true,
    });
  });

  it("indexes pages by default", () => {
    expect(buildMetadata().robots).toMatchObject({ index: true, follow: true });
  });
});

type Node = Record<string, unknown>;

/** Every `{ "@id": … }` value anywhere in a node that is a reference, not a definition. */
function references(value: unknown, isRoot = true): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => references(item, false));
  if (!value || typeof value !== "object") return [];
  const node = value as Node;
  const keys = Object.keys(node);
  if (!isRoot && keys.length === 1 && keys[0] === "@id") return [node["@id"] as string];
  return Object.values(node).flatMap((child) => references(child, false));
}

function graphOf(document: { "@context": string; "@graph": Node[] }): Node[] {
  expect(document["@context"]).toBe("https://schema.org");
  expect(Array.isArray(document["@graph"])).toBe(true);
  for (const node of document["@graph"]) {
    expect(typeof node["@type"]).toBe("string");
  }
  return document["@graph"];
}

function definedIds(nodes: Node[]): string[] {
  return nodes.map((node) => node["@id"]).filter((id): id is string => typeof id === "string");
}

describe("JSON-LD", () => {
  const site = graphOf(siteJsonLd());

  it("site graph is self-contained", () => {
    const ids = definedIds(site);
    for (const ref of site.flatMap((node) => references(node))) {
      expect(ids).toContain(ref);
    }
  });

  it("home graph references resolve against itself plus the site graph", () => {
    const home = graphOf(homeJsonLd());
    const ids = definedIds([...site, ...home]);
    expect(new Set(ids).size).toBe(ids.length);
    const refs = home.flatMap((node) => references(node));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ids).toContain(ref);
  });

  it("doc graph references resolve against itself plus the site graph", () => {
    const doc = graphOf(
      docJsonLd(
        { title: "Quickstart", description: "Start.", path: "/docs/quickstart" },
        [
          { name: "Docs", path: "/docs" },
          { name: "Quickstart", path: "/docs/quickstart" },
        ],
      ),
    );
    const ids = definedIds([...site, ...doc]);
    const refs = doc.flatMap((node) => references(node));
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ids).toContain(ref);

    const breadcrumb = doc.find((node) => node["@type"] === "BreadcrumbList") as {
      itemListElement: { position: number; item: string }[];
    };
    expect(breadcrumb.itemListElement.map((item) => item.position)).toEqual([1, 2]);
    expect(breadcrumb.itemListElement[1].item).toBe(absoluteUrl("/docs/quickstart"));
  });
});
