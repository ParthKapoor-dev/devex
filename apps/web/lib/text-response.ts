import { linkHeaderValue } from "@/lib/agents";

/**
 * The response shape every agent-facing text surface uses.
 *
 * Three things matter and all three are easy to forget one at a time:
 * an explicit charset (a client that guesses gets the em-dashes wrong), a
 * cache policy that lets a CDN serve it instantly but never freezes a stale
 * copy, and the RFC 8288 `Link` header that tells whoever fetched this
 * document what else is available. Centralised so no surface ships without
 * all three.
 */
export function textResponse(
  body: string,
  contentType: "text/plain" | "text/markdown" = "text/plain",
): Response {
  return new Response(body, {
    headers: {
      "Content-Type": `${contentType}; charset=utf-8`,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      Link: linkHeaderValue(),
      // These documents vary by nothing, but saying so keeps a shared cache
      // from inheriting the app's RSC Vary and fragmenting the entry.
      Vary: "Accept",
    },
  });
}

/** Same, for JSON discovery documents that need a specific media type. */
export function jsonResponse(value: unknown, contentType: string): Response {
  return new Response(JSON.stringify(value, null, 2) + "\n", {
    headers: {
      "Content-Type": contentType,
      "Cache-Control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      Link: linkHeaderValue(),
    },
  });
}
