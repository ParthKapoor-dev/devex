import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSections } from "@/lib/docs/source";

/**
 * Every page in the docs, grouped by section.
 *
 * This replaces a hand-written "Where to go next" list at the bottom of
 * `index.mdx` that named four of the seven pages and would have gone stale the
 * first time anybody added one. It is generated from the same source the
 * sidebar reads, so a new `.mdx` file appears here without anyone remembering
 * to link it.
 *
 * Descriptions come from frontmatter, which means this doubles as a check on
 * whether a page's description is actually worth reading — if it looks weak
 * here, it is also the snippet Google shows.
 *
 * A server component; the filesystem read happens at build time.
 */
export function DocsIndex() {
  const sections = getSections();

  return (
    <div className="mt-16 space-y-10 border-t border-edge pt-10">
      {sections.map((section) => (
        <section key={section.title}>
          <h2 className="label mb-4 text-ink-subtle">{section.title}</h2>

          <ul className="grid gap-px overflow-hidden rounded-lg border border-edge bg-edge sm:grid-cols-2">
            {section.docs.map((doc) => (
              <li key={doc.url}>
                <Link
                  href={doc.url}
                  className="group flex h-full flex-col bg-canvas p-5 transition-colors duration-[--duration-fast] hover:bg-surface"
                >
                  <span className="flex items-center gap-2 font-medium text-ink">
                    {doc.frontmatter.title}
                    <ArrowRight
                      className="size-3.5 text-ink-subtle transition-[transform,color] duration-[--duration-fast] group-hover:translate-x-0.5 group-hover:text-brand"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1.5 text-sm leading-relaxed text-ink-muted">
                    {doc.frontmatter.description}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
