import { describe, expect, it } from "vitest";
import { getDocs } from "@/lib/docs/source";
import { llmsDocsIndex, llmsFull, llmsIndex } from "@/lib/llms";
import { absoluteUrl, siteConfig } from "@/lib/site";

describe("llms.txt", () => {
  const published = getDocs().filter((doc) => !doc.frontmatter.draft && !doc.frontmatter.hidden);

  it("index opens with the site name and a summary blockquote", () => {
    const text = llmsIndex();
    expect(text.startsWith(`# ${siteConfig.name}\n\n> `)).toBe(true);
  });

  it("index uses absolute links and lists every visible doc", () => {
    const text = llmsIndex();
    const links = [...text.matchAll(/\]\(([^)]+)\)/g)].map((match) => match[1]);
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link).toMatch(/^https?:\/\//);
    for (const doc of published) expect(text).toContain(`](${absoluteUrl(doc.url)})`);
  });

  it("docs index lists every visible doc", () => {
    const text = llmsDocsIndex();
    expect(text.startsWith(`# ${siteConfig.name} documentation`)).toBe(true);
    for (const doc of published) expect(text).toContain(`](${absoluteUrl(doc.url)})`);
  });

  it("full text starts with the index and inlines every non-draft doc", () => {
    const text = llmsFull();
    expect(text.startsWith(llmsIndex())).toBe(true);
    for (const doc of getDocs().filter((d) => !d.frontmatter.draft)) {
      expect(text).toContain(`Source: ${absoluteUrl(doc.url)}`);
    }
  });
});
