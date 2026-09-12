import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, ChevronRight, Pencil } from "lucide-react";
import {
  getBreadcrumbs,
  getDoc,
  getDocs,
  getNeighbours,
} from "@/lib/docs/source";
import { buildMetadata, breadcrumbJsonLd, techArticleJsonLd } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import { TableOfContents } from "@/components/docs/table-of-contents";

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
    title: doc.frontmatter.title,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            techArticleJsonLd({
              title: doc.frontmatter.title,
              description: doc.frontmatter.description,
              path: doc.url,
              modifiedTime: doc.lastModified,
            }),
            breadcrumbJsonLd(breadcrumbs),
          ]),
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:px-8">
        <article className="min-w-0 flex-1">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-ink-subtle">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.path}-${index}`} className="flex items-center gap-1">
                  {index > 0 ? (
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  ) : null}
                  {index === breadcrumbs.length - 1 ? (
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
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {doc.frontmatter.title}
            </h1>
            <p className="mt-3 text-lg leading-relaxed text-ink-muted">
              {doc.frontmatter.description}
            </p>
          </header>

          {/* The MDX body. Components come from mdx-components.tsx. */}
          <div className="docs-prose">
            <Content />
          </div>

          {/* Pager */}
          <nav className="mt-16 grid gap-3 border-t border-edge pt-8 sm:grid-cols-2">
            {previous ? (
              <Link
                href={previous.url}
                className="group flex flex-col gap-1 rounded-lg border border-edge p-4 transition-colors duration-[--duration-fast] hover:border-brand/40 hover:bg-surface"
              >
                <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
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
                className="group flex flex-col items-end gap-1 rounded-lg border border-edge p-4 text-right transition-colors duration-[--duration-fast] hover:border-brand/40 hover:bg-surface sm:col-start-2"
              >
                <span className="flex items-center gap-1.5 text-xs text-ink-subtle">
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
          <div className="sticky top-24">
            <TableOfContents entries={doc.toc} />
            <a
              href={editUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex items-center gap-1.5 border-t border-edge pt-4 text-xs text-ink-subtle transition-colors duration-[--duration-fast] hover:text-brand"
            >
              <Pencil className="size-3" aria-hidden="true" />
              Edit this page
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
