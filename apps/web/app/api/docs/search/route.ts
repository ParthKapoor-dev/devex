import { NextResponse } from "next/server";
import { getDocs } from "@/lib/docs/source";

/**
 * Docs search for the global command menu.
 *
 * The in-page docs search (`components/docs/search`) matches entirely on the
 * client against an index passed down from the layout. The command menu is
 * mounted on every route, though, so shipping the same index into the root
 * layout would put the whole corpus in the bundle for visitors who never open
 * the docs. This endpoint keeps it server-side instead.
 */
export const dynamic = "force-static";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const terms = query.toLowerCase().split(/\s+/);

  const results = getDocs()
    .filter((doc) => !doc.frontmatter.draft)
    .map((doc) => {
      const title = doc.frontmatter.title.toLowerCase();
      const description = doc.frontmatter.description.toLowerCase();
      const body = doc.plain.toLowerCase();

      let score = 0;
      for (const term of terms) {
        if (title.startsWith(term)) score += 50;
        else if (title.includes(term)) score += 30;
        else if (description.includes(term)) score += 10;
        else if (body.includes(term)) score += 3;
        else return null;
      }

      return {
        score,
        name: doc.frontmatter.title,
        path: doc.url,
        type: "file" as const,
        description: doc.frontmatter.description,
      };
    })
    .filter((hit): hit is NonNullable<typeof hit> => hit !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map(({ score: _score, ...rest }) => rest);

  return NextResponse.json({ results });
}
