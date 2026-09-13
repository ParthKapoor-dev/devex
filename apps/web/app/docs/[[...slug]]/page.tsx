import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Github,
  Pencil,
  Rocket,
} from "lucide-react";
import {
  getBreadcrumbs,
  getDoc,
  getDocs,
  getNeighbours,
} from "@/lib/docs/source";
import { buildMetadata, docJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { TableOfContents } from "@/components/docs/table-of-contents";
import { DocsIndex } from "@/components/docs/docs-index";

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

/** Every docs page is prerendered — the filesystem is never read at request time. */
export function generateStaticParams() {
  return getDocs().map((doc) => ({
    slug: doc.slug.length ? doc.slug : undefined,
  }));
}

export async function generateMetadata({
  params,
}: DocsPageProps): Promise<Metadata> {
  const { slug = [] } = await params;
  const doc = getDoc(slug);

  if (!doc) return buildMetadata({ title: "Not found", noIndex: true });

  return buildMetadata({
    // The docs root's own title is "Introduction", which says nothing in a
    // search result; the result is for the documentation as a whole.
    title: doc.slug.length ? doc.frontmatter.title : "Documentation",
    titleSuffix: `${siteConfig.name} docs`,
    description: doc.frontmatter.description,
    path: doc.url,
    type: "article",
    modifiedTime: doc.lastModified,
    noIndex: doc.frontmatter.draft,
  });
}

export default async function DocsPage({ params }: DocsPageProps) {
  const { slug = [] } = await params;
  const doc = getDoc(slug);

  if (!doc) notFound();

  // Static import of the page body. The path is built from the doc's own file
  // entry, so only files that exist under content/docs can be reached.
  const { default: Content } = await import(`@/content/docs/${doc.file}`);

  const { previous, next } = getNeighbours(doc.slug);
  const breadcrumbs = getBreadcrumbs(doc);
  const editUrl = `${siteConfig.repo}/blob/main/apps/web/content/docs/${doc.file}`;

  // The root is the entry point to the section, not just another page in it.
  // It gets a landing treatment: no breadcrumb trail back to itself, a display
  // heading a size larger, two routes in rather than a wall of prose, and a
  // generated index of everything underneath.
  const isRoot = doc.slug.length === 0;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            docJsonLd(
              {
                title: doc.frontmatter.title,
                description: doc.frontmatter.description,
                path: doc.url,
                modifiedTime: doc.lastModified,
              },
              breadcrumbs,
            ),
          ),
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <article className="min-w-0 flex-1">
          {isRoot ? <DocsHome /> : <DocHeader doc={doc} crumbs={breadcrumbs} />}

          {/* The MDX body. Components come from mdx-components.tsx. */}
          <div className="max-w-[68ch]">
            <Content />
          </div>

          {isRoot ? <DocsIndex /> : null}

          {/* Pager. The root has no "previous" — it is the beginning. */}
          <nav className="mt-16 grid gap-3 border-t border-edge pt-8 sm:grid-cols-2">
            {previous ? (
              <Link
                href={previous.url}
                className="group flex flex-col gap-1 rounded-md border border-edge p-4 transition-colors duration-[--duration-fast] hover:border-edge-strong hover:bg-surface"
              >
                <span className="label flex items-center gap-1.5 text-ink-subtle">
                  <ArrowLeft className="size-3.5 transition-transform duration-[--duration-fast] group-hover:-translate-x-0.5" />
                  Previous
                </span>
                <span className="font-medium text-ink">
                  {previous.frontmatter.title}
                </span>
              </Link>
            ) : (
              <span />
            )}

            {next ? (
              <Link
                href={next.url}
                className="group flex flex-col items-end gap-1 rounded-md border border-edge p-4 text-right transition-colors duration-[--duration-fast] hover:border-edge-strong hover:bg-surface sm:col-start-2"
              >
                <span className="label flex items-center gap-1.5 text-ink-subtle">
                  Next
                  <ArrowRight className="size-3.5 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5" />
                </span>
                <span className="font-medium text-ink">
                  {next.frontmatter.title}
                </span>
              </Link>
            ) : null}
          </nav>
        </article>

        {/* On-page table of contents */}
        <aside className="hidden w-56 shrink-0 xl:block">
          {/* Capped and scrollable in its own right: a page with thirty
              headings would otherwise run the list off the bottom of a laptop
              screen with no way to reach the end. */}
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pb-8">
            <TableOfContents entries={doc.toc} />

            <div className="mt-6 space-y-2 border-t border-edge pt-4 text-xs text-ink-subtle">
              <a
                href={editUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 transition-colors duration-[--duration-fast] hover:text-brand"
              >
                <Pencil className="size-3" aria-hidden="true" />
                Edit this page
              </a>
              {/* `lastModified` was computed for the metadata and then never
                  shown to a reader, who is the person it actually matters to —
                  a docs page with no date is a docs page you have to guess
                  about. */}
              <p className="flex items-center gap-1.5">
                Updated{" "}
                <time dateTime={doc.lastModified} className="tabular-nums">
                  {new Date(doc.lastModified).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function DocHeader({
  doc,
  crumbs,
}: {
  doc: NonNullable<ReturnType<typeof getDoc>>;
  crumbs: { name: string; path: string }[];
}) {
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-subtle">
          {crumbs.map((crumb, index) => (
            <li key={`${crumb.path}-${index}`} className="flex items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3.5" aria-hidden="true" />
              ) : null}
              {index === crumbs.length - 1 ? (
                <span className="text-ink-muted">{crumb.name}</span>
              ) : (
                <Link
                  href={crumb.path}
                  className="transition-colors duration-[--duration-fast] hover:text-brand"
                >
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="mb-8">
        <h1 className="font-display text-3xl font-medium tracking-[-0.03em] text-ink sm:text-4xl">
          {doc.frontmatter.title}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-muted">
          {doc.frontmatter.description}
        </p>
      </header>
    </>
  );
}

function DocsHome() {
  return (
    <header className="mb-12 border-b border-edge pb-10">
      <p className="label mb-4 text-ink-subtle">Documentation</p>

      <h1 className="max-w-3xl text-balance font-display text-4xl font-medium leading-[1.08] tracking-[-0.035em] text-ink sm:text-5xl">
        A real machine, <span className="text-brand">documented.</span>
      </h1>

      <p className="mt-5 max-w-2xl text-balance text-lg leading-relaxed text-ink-muted">
        How DevEx works, how to run it on your own cluster, and how to add to
        it. Written to explain the mechanism rather than restate the API.
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href="/docs/quickstart"
          className="group inline-flex h-10 items-center gap-2 rounded-md bg-brand px-4 text-sm font-medium text-brand-fg transition-colors duration-[--duration-fast] hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Rocket className="size-4" aria-hidden="true" />
          Quickstart
          <ArrowRight
            className="size-4 transition-transform duration-[--duration-fast] group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>

        <Link
          href="/docs/self-hosting"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-edge px-4 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Run it yourself
        </Link>

        <a
          href={siteConfig.repo}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-md border border-edge px-4 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Github className="size-4" aria-hidden="true" />
          Source
        </a>
      </div>
    </header>
  );
}
