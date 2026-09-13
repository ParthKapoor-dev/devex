import { getDoc, getDocs } from "@/lib/docs/source";
import { absoluteUrl } from "@/lib/site";
import { textResponse } from "@/lib/text-response";

/**
 * The markdown twin of every documentation page.
 *
 * Reached as `/docs/quickstart.md`, not at this path — `next.config.ts`
 * rewrites the `.md` suffix here. It has to live under its own segment because
 * a Next route segment is a whole path component: `[slug].md` is not a dynamic
 * segment, it is a directory literally called "[slug].md".
 *
 * The body is the MDX with its components unwrapped (see `toMarkdown` in
 * lib/docs/source.ts), so what comes back is what an author wrote rather than
 * what a browser renders.
 */

export const dynamic = "force-static";

export function generateStaticParams() {
  return getDocs().map((doc) => ({ slug: doc.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
): Promise<Response> {
  const { slug = [] } = await params;
  const doc = getDoc(slug);

  if (!doc) {
    return new Response(
      [
        "# 404 — no such page",
        "",
        `There is no documentation page at \`/docs/${slug.join("/")}\`.`,
        "",
        `- Documentation index: ${absoluteUrl("/docs/llms.txt")}`,
        `- Everything, in one file: ${absoluteUrl("/llms-full.txt")}`,
        "",
      ].join("\n"),
      { status: 404, headers: { "Content-Type": "text/markdown; charset=utf-8" } },
    );
  }

  const body = [
    "---",
    `title: ${JSON.stringify(doc.frontmatter.title)}`,
    `description: ${JSON.stringify(doc.frontmatter.description)}`,
    `source: ${absoluteUrl(doc.url)}`,
    `updated: ${doc.lastModified.slice(0, 10)}`,
    "---",
    "",
    `# ${doc.frontmatter.title}`,
    "",
    doc.frontmatter.description,
    "",
    doc.markdown,
    "",
  ].join("\n");

  return textResponse(body, "text/markdown");
}
