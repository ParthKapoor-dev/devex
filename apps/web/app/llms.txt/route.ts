import { llmsIndex } from "@/lib/llms";
import { textResponse } from "@/lib/text-response";

/**
 * `/llms.txt` — the index an agent reads first.
 *
 * See lib/llms.ts for what goes in it and why. Static: the content is derived
 * from files in the repository, so it is fixed at build time.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return textResponse(llmsIndex());
}
