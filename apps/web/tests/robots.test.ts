import { afterEach, describe, expect, it, vi } from "vitest";
import { DISALLOWED_PATHS, TRAINING_ONLY_CRAWLERS } from "@/lib/agents";
import { GET } from "@/app/robots.txt/route";

// robots.txt is assembled in its route handler, not in lib/, but the handler
// is a pure function of the environment and lib/agents.ts, so it is tested here.

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("robots.txt", () => {
  it("in production, disallows the private paths for every crawler", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    const response = GET();
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");

    const text = await response.text();
    for (const path of DISALLOWED_PATHS) {
      expect(text).toContain(`Disallow: ${path}`);
    }
    for (const agent of TRAINING_ONLY_CRAWLERS) {
      expect(text).toContain(`User-agent: ${agent}\nDisallow: /\n`);
    }
    expect(text).toMatch(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m);
  });

  it("outside production, disallows everything", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    const text = await GET().text();
    expect(text).toContain("User-agent: *\nDisallow: /\n");
    expect(text).not.toContain("Allow: /");
  });
});
