import { jsonResponse } from "@/lib/text-response";
import { ardCatalog } from "@/lib/well-known";

/**
 * `/.well-known/ard.json` — Agentic Resource Discovery.
 *
 * Rewritten here from the dotted path in next.config.ts. See lib/well-known.ts.
 */

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(ardCatalog(), "application/json; charset=utf-8");
}
