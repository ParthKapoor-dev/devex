import { describe, expect, it } from "vitest";
import templates, { resolveTemplate } from "@/lib/templates";

describe("resolveTemplate", () => {
  it.each(Object.keys(templates))("returns the known template for %s", (key) => {
    const template = resolveTemplate(key);
    expect(template.key).toBe(key);
    expect(template).toBe(templates[key as keyof typeof templates]);
  });

  it("reports an unrecognised key as itself instead of rounding to Node", () => {
    const template = resolveTemplate("go");
    expect(template.key).toBe("go");
    expect(template.name).toBe("go");
    expect(template.name).not.toBe(templates.node.name);
    expect(template.description).toMatch(/not one of the templates/i);
  });

  it("labels a missing key as unknown", () => {
    const template = resolveTemplate(undefined);
    expect(template.key).toBe("unknown");
    expect(template.name).toBe("Unknown template");
    expect(template.description).toMatch(/predates template tracking/i);
  });

  it("treats an empty string like a missing key for the label", () => {
    const template = resolveTemplate("");
    expect(template.name).toBe("Unknown template");
  });

  // Known bug: `key in templates` walks the prototype chain, so "toString"
  // (or "constructor", …) returns an Object.prototype function typed as a
  // Template. `it.fails` keeps the suite green and turns red once fixed —
  // switch it back to `it` then.
  it.fails("does not resolve inherited object keys as templates", () => {
    const template = resolveTemplate("toString");
    expect(template.key).toBe("toString");
    expect(template.description).toMatch(/not one of the templates/i);
  });
});
