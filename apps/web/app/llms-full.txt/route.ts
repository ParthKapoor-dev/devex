import { llmsFull } from "@/lib/llms";
import { textResponse } from "@/lib/text-response";

/**
 * `/llms-full.txt` — the index plus every documentation page inlined.
 *
 * For a client that would rather spend one request than a dozen. The index at
 * `/llms.txt` stays short precisely because this exists.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return textResponse(llmsFull());
}
