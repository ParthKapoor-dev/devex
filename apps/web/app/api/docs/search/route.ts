import { NextResponse } from "next/server";
import { getDocs } from "@/lib/docs/source";

/**
 * The docs index, for the global command palette.
 *
 * ## Why this is not a search endpoint any more
 *
 * It used to take a `?q=` and score server-side. It also declared
 * `dynamic = "force-static"`, which makes `request.url` carry no search params
 * at all — so every call scored the empty string, took the `else return null`
 * branch for every document, and answered `{"results":[]}`. Docs search in the
 * command palette had never returned anything.
 *
 * Rather than make the route dynamic — a server round trip per keystroke, for
 * a corpus of seven pages — it now serves the whole index once. The palette
 * fetches it lazily the first time it is opened and scores on the client, so
 * typing costs nothing and the response is cacheable forever.
 *
 * The in-page docs search (`components/docs/search`) still gets its index
 * directly from the layout; it is only ever mounted under /docs, so it does
 * not need this. The palette is mounted on every route, which is why the
 * corpus must not go in the root layout's bundle.
 */
export const dynamic = "force-static";

export interface DocsIndexEntry {
  title: string;
  description: string;
  url: string;
  section: string;
  /** Enough body text to match on without shipping the whole corpus. */
  excerpt: string;
}

export async function GET() {
  const entries: DocsIndexEntry[] = getDocs()
    .filter((doc) => !doc.frontmatter.draft)
    .map((doc) => ({
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      url: doc.url,
      section: doc.frontmatter.section ?? "Guides",
      excerpt: doc.plain.slice(0, 600),
    }));

  return NextResponse.json({ docs: entries });
}
