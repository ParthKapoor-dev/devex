import { describe, expect, it } from "vitest";
import {
  AGENT_SURFACES,
  ANSWER_ENGINE_CRAWLERS,
  DISALLOWED_PATHS,
  TRAINING_ONLY_CRAWLERS,
  linkHeaderValue,
} from "@/lib/agents";
import { absoluteUrl } from "@/lib/site";

describe("crawler policy", () => {
  it("disallows the API, REPL and demo paths", () => {
    expect(DISALLOWED_PATHS).toEqual(expect.arrayContaining(["/api/", "/repl/", "/demo"]));
  });

  it("never lists a crawler as both answer engine and training-only", () => {
    const answer = new Set<string>(ANSWER_ENGINE_CRAWLERS);
    for (const agent of TRAINING_ONLY_CRAWLERS) expect(answer.has(agent)).toBe(false);
  });
});

describe("linkHeaderValue", () => {
  const value = linkHeaderValue();

  it("advertises every agent surface with an absolute URL", () => {
    for (const surface of AGENT_SURFACES) {
      expect(value).toContain(`<${absoluteUrl(surface.path)}>; rel="${surface.rel}"`);
    }
  });

  it("strips media-type parameters so no quotes are nested", () => {
    for (const entry of value.split(", ")) {
      const type = /type="([^"]*)"/.exec(entry)?.[1];
      expect(type).toBeDefined();
      expect(type).not.toContain(";");
      // Exactly two quoted parameters per entry: rel and type.
      expect(entry.match(/"/g)).toHaveLength(4);
    }
  });
});
