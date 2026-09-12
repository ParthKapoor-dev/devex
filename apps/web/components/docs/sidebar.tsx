"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SidebarSection {
  title: string;
  items: { title: string; url: string }[];
}

/**
 * Docs navigation.
 *
 * The active row is marked by a rail indicator that slides between entries.
 * It animates `transform` and `height` on a single absolutely-positioned
 * element rather than animating each row, so the browser composites one layer
 * instead of re-laying-out the list.
 */
export function DocsSidebar({
  sections,
  onNavigate,
}: {
  sections: SidebarSection[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState<{
    top: number;
    height: number;
  } | null>(null);

  // Longest-prefix match, so /docs/guides/templates still highlights its own
  // row rather than falling back to /docs. An exact-equality check (the usual
  // bug here) would leave nested pages with nothing selected.
  const activeUrl = React.useMemo(() => {
    const candidates = sections
      .flatMap((section) => section.items.map((item) => item.url))
      .filter((url) => pathname === url || pathname.startsWith(`${url}/`));

    return candidates.sort((a, b) => b.length - a.length)[0] ?? null;
  }, [pathname, sections]);

  React.useLayoutEffect(() => {
    const container = listRef.current;
    if (!container || !activeUrl) {
      setIndicator(null);
      return;
    }

    const active = container.querySelector<HTMLElement>(
      `[data-url="${CSS.escape(activeUrl)}"]`,
    );
    if (!active) return;

    setIndicator({ top: active.offsetTop, height: active.offsetHeight });
  }, [activeUrl, sections]);

  return (
    <nav aria-label="Documentation" className="relative">
      <div ref={listRef} className="relative">
        {/* Sliding rail indicator. */}
        {indicator ? (
          <span
            aria-hidden="true"
            className="absolute left-0 w-0.5 rounded-full bg-brand transition-[transform,height] duration-[--duration-normal] ease-[--ease-out-expo]"
            style={{
              height: indicator.height,
              transform: `translateY(${indicator.top}px)`,
            }}
          />
        ) : null}

        <div className="space-y-6 border-l border-edge">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="label mb-2 pl-4 text-ink-subtle">
                {section.title}
              </p>
              <ul>
                {section.items.map((item) => {
                  const isActive = item.url === activeUrl;
                  return (
                    <li key={item.url}>
                      <Link
                        href={item.url}
                        data-url={item.url}
                        onClick={onNavigate}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "block py-1.5 pl-4 pr-2 text-sm transition-colors duration-[--duration-fast]",
                          isActive
                            ? "font-medium text-ink"
                            : "text-ink-subtle hover:text-ink-muted",
                        )}
                      >
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}
