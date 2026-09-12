import { pricingMarkdown } from "@/lib/pricing";
import { textResponse } from "@/lib/text-response";

/**
 * `/pricing.md` — the plans as markdown.
 *
 * An agent comparing products should not have to parse a marketing page with
 * an animated price counter in it to find out that the free tier is two
 * workspaces. Same table as the `/pricing` route; see lib/pricing.ts.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return textResponse(pricingMarkdown(), "text/markdown");
}
