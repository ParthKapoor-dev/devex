import { jsonResponse } from "@/lib/text-response";
import { API_CATALOG_CONTENT_TYPE, apiCatalog } from "@/lib/well-known";

/**
 * `/.well-known/api-catalog` — RFC 9727.
 *
 * The media type matters as much as the body: a linkset served as plain JSON
 * is not a catalogue as far as the spec is concerned.
 */

export const dynamic = "force-static";

export function GET(): Response {
  return jsonResponse(apiCatalog(), API_CATALOG_CONTENT_TYPE);
}
