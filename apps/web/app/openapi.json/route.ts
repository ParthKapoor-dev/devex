import { openApiDocument } from "@/lib/openapi";
import { jsonResponse } from "@/lib/text-response";

/**
 * `/openapi.json` — the machine-readable description of the DevEx API.
 *
 * Served from the site origin rather than the API origin because that is where
 * anything looking for it will look, and because it is documentation: nothing
 * in apps/core changes because this route exists. See lib/openapi.ts.
 */

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(openApiDocument(), "application/json; charset=utf-8");
}
