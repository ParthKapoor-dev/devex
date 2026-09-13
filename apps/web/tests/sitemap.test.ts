import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { llmsIndex } from "@/lib/llms";

describe("sitemap", () => {
  const entries = sitemap();

  it("has absolute URLs, valid lastModified dates and no duplicates", () => {
    for (const entry of entries) {
      expect(entry.url).toMatch(/^https?:\/\//);
      expect(entry.lastModified).toBeInstanceOf(Date);
      expect(Number.isNaN((entry.lastModified as Date).getTime()), entry.url).toBe(false);
    }
    const urls = entries.map((entry) => entry.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("lists no pricing page and no authenticated routes", () => {
    for (const entry of entries) {
      const { pathname } = new URL(entry.url);
      expect(pathname).not.toMatch(/^\/(pricing|dashboard|repl|login|api)(\/|$)/);
    }
  });

  it("matches the URL count llms.txt claims", () => {
    const claimed = /All (\d+) public URLs/.exec(llmsIndex())?.[1];
    expect(Number(claimed)).toBe(entries.length);
  });
});
