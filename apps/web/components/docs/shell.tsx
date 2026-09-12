"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { DocsSidebar, type SidebarSection } from "@/components/docs/sidebar";
import { DocsSearch, type SearchDoc } from "@/components/docs/search";

/**
 * The docs chrome: a sticky sidebar on desktop, a slide-over on mobile, and the
 * search trigger.
 *
 * Kept as one client component so the sidebar's open/closed state and the
 * search dialog share a single boundary — the page content passed as
 * `children` stays a server component and is never re-rendered by either.
 */
export function DocsShell({
  sections,
  searchIndex,
  children,
}: {
  sections: SidebarSection[];
  searchIndex: SearchDoc[];
  children: React.ReactNode;
}) {
  const [navOpen, setNavOpen] = React.useState(false);
  const pathname = usePathname();

  // Close the slide-over after a navigation.
  React.useEffect(() => setNavOpen(false), [pathname]);

  // Lock the background while the slide-over is up.
  React.useEffect(() => {
    if (!navOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-canvas pt-16">
      {/* Mobile bar */}
      <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-edge bg-canvas/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          className="flex items-center gap-2 rounded-md border border-edge px-2.5 py-1.5 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/40 hover:text-ink"
          aria-label="Open documentation navigation"
        >
          <Menu className="size-4" aria-hidden="true" />
          Menu
        </button>
        <div className="flex-1">
          <DocsSearch docs={searchIndex} />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[90rem] gap-8 px-4 sm:px-6 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto py-8 pr-2">
            <div className="mb-6">
              <DocsSearch docs={searchIndex} />
            </div>
            <DocsSidebar sections={sections} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile slide-over */}
      {navOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto border-r border-edge bg-canvas p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-ink">Documentation</span>
              <button
                type="button"
                onClick={() => setNavOpen(false)}
                aria-label="Close navigation"
                className="rounded-md p-1 text-ink-subtle hover:text-ink"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <DocsSidebar
              sections={sections}
              onNavigate={() => setNavOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
