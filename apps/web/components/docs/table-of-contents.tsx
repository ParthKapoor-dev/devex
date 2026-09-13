"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TocEntry } from "@/lib/docs/source";

/**
 * On-page table of contents with scroll spy.
 *
 * Uses a single IntersectionObserver over the heading elements rather than a
 * scroll listener, so it costs nothing while the reader is idle. The active
 * heading is the topmost one currently intersecting; if none are (the reader is
 * mid-section, past a heading but before the next), the last one seen above the
 * viewport stays active.
 */
export function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (entries.length === 0) return;

    const elements = entries
      .map((entry) => document.getElementById(entry.id))
      .filter((element): element is HTMLElement => element !== null);

    if (elements.length === 0) return;

    const visible = new Set<string>();

    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) {
          if (record.isIntersecting) visible.add(record.target.id);
          else visible.delete(record.target.id);
        }

        // Prefer the first heading in document order that is on screen.
        const firstVisible = entries.find((entry) => visible.has(entry.id));
        if (firstVisible) {
          setActiveId(firstVisible.id);
          return;
        }

        // Nothing visible: fall back to the last heading scrolled past.
        let lastAbove: string | null = null;
        for (const element of elements) {
          if (element.getBoundingClientRect().top < 100) lastAbove = element.id;
        }
        setActiveId(lastAbove);
      },
      // Top band of the viewport: a heading counts as "current" once it reaches
      // roughly the first quarter of the screen.
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const element of elements) observer.observe(element);
    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-labelledby="toc-heading">
      <p
        id="toc-heading"
        className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle"
      >
        On this page
      </p>
      <ul className="space-y-1 border-l border-edge text-sm">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={activeId === entry.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 transition-colors duration-[--duration-fast]",
                entry.depth === 3 ? "pl-6" : "pl-3",
                activeId === entry.id
                  ? "border-brand font-medium text-brand"
                  : "border-transparent text-ink-subtle hover:border-edge-strong hover:text-ink",
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
