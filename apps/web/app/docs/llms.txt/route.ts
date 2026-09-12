import { llmsDocsIndex } from "@/lib/llms";
import { textResponse } from "@/lib/text-response";

/**
 * `/docs/llms.txt` — the index, scoped to the documentation.
 *
 * A section-level llms.txt lets an agent that only needs the docs pull just
 * the docs, instead of the whole site's index. Same generator as `/llms.txt`,
 * different slice.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return textResponse(llmsDocsIndex());
}
