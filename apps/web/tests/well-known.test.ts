import { describe, expect, it } from "vitest";
import { API_ORIGIN } from "@/lib/agents";
import { agentSkillsIndex, apiCatalog, ardCatalog } from "@/lib/well-known";

describe("well-known documents", () => {
  it("api catalogue anchors on the API origin and links the OpenAPI description", () => {
    const [entry] = apiCatalog().linkset;
    expect(entry.anchor).toBe(API_ORIGIN);
    expect(entry["service-desc"][0].href).toMatch(/^https?:\/\/.+\/openapi\.json$/);
  });

  it("ARD catalogue does not advertise a hosted MCP serverUrl", () => {
    const catalog = ardCatalog();
    expect(catalog.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const mcp = catalog.resources.find((resource) => resource.type === "mcp-server");
    expect(mcp).toBeDefined();
    expect(mcp).not.toHaveProperty("serverUrl");
  });

  it("agent skills have unique names and absolute surface URLs", () => {
    const index = agentSkillsIndex();
    const names = index.skills.map((skill) => skill.name);
    expect(new Set(names).size).toBe(names.length);
    for (const surface of index.surfaces) {
      expect(surface.url).toMatch(/^https?:\/\//);
    }
  });
});
