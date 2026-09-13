import { describe, expect, it } from "vitest";
import { linkHeaderValue } from "@/lib/agents";
import { jsonResponse, textResponse } from "@/lib/text-response";

describe("textResponse", () => {
  it("defaults to plain text with an explicit charset", async () => {
    const response = textResponse("hello — world");
    expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await response.text()).toBe("hello — world");
  });

  it("serves markdown when asked", () => {
    const response = textResponse("# Title", "text/markdown");
    expect(response.headers.get("Content-Type")).toBe("text/markdown; charset=utf-8");
  });

  it("keeps machine copies out of the search index and advertises surfaces", () => {
    const response = textResponse("x");
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(response.headers.get("Link")).toBe(linkHeaderValue());
    expect(response.headers.get("Cache-Control")).toContain("s-maxage=3600");
  });
});

describe("jsonResponse", () => {
  it("serialises the value with the given media type", async () => {
    const response = jsonResponse({ a: 1 }, "application/json");
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("Link")).toBe(linkHeaderValue());
    expect(JSON.parse(await response.text())).toEqual({ a: 1 });
  });
});
