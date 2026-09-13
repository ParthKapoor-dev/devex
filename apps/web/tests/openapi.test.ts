import { describe, expect, it } from "vitest";
import { openApiDocument } from "@/lib/openapi";

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "head", "options", "trace"];

describe("openApiDocument", () => {
  const document = openApiDocument();

  it("has the OpenAPI 3.1 top-level shape", () => {
    expect(document.openapi).toMatch(/^3\.1\./);
    expect(document.info.title).toBeTruthy();
    expect(document.info.version).toBeTruthy();
    expect(Object.keys(document.paths).length).toBeGreaterThan(0);
    expect(document.components.schemas).toBeTypeOf("object");
    expect(document.components.securitySchemes).toHaveProperty("sessionCookie");
  });

  const operations = (Object.values(document.paths) as Record<string, unknown>[]).flatMap(
    (item) =>
      HTTP_METHODS.flatMap((method) => {
        const operation = item[method] as
          | { operationId?: string; description?: string }
          | undefined;
        return operation ? [operation] : [];
      }),
  );

  it("gives every operation a unique operationId", () => {
    const ids = operations.map((operation) => operation.operationId);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) expect(id).toBeTruthy();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every operation a description, except the known gap", () => {
    // lib/openapi.ts promises a description on every operation; getCurrentUser
    // (GET /auth/me) has only a summary. Pinned here so a new gap fails the
    // test — remove the entry once the description is added.
    const missing = operations
      .filter((operation) => !operation.description)
      .map((operation) => operation.operationId);
    expect(missing).toEqual(["getCurrentUser"]);
  });

  it("only $refs components that exist", () => {
    const refs = [...JSON.stringify(document).matchAll(/"\$ref":"([^"]+)"/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) {
      const match = /^#\/components\/schemas\/(.+)$/.exec(ref);
      expect(match, ref).not.toBeNull();
      expect(document.components.schemas).toHaveProperty(match![1]);
    }
  });
});
