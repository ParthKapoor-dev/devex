"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DIRECTIONS } from "./directions";
import { cn } from "@/lib/utils";

/** Floating pill for flipping between mocks. Mock-only chrome. */
export function MockSwitcher() {
  const pathname = usePathname() ?? "";
  const [, , slug, sub] = pathname.split("/");
  const isLogin = sub === "login";

  return (
    <nav
      aria-label="Design mocks"
      className="fixed bottom-4 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-1 rounded-full border border-edge bg-overlay/85 p-1 font-mono text-[11px] uppercase tracking-wider text-ink-muted shadow-[0_12px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-md"
    >
      <Link
        href="/mocks"
        className={cn(
          "rounded-full px-3 py-1.5 transition-colors hover:text-ink",
          !slug && "bg-raised text-ink",
        )}
      >
        All
      </Link>
      <span className="mx-0.5 h-4 w-px bg-edge" />
      {DIRECTIONS.map((d) => (
        <Link
          key={d.slug}
          href={`/mocks/${d.slug}${isLogin ? "/login" : ""}`}
          title={d.name}
          className={cn(
            "rounded-full px-3 py-1.5 transition-colors hover:text-ink",
            slug === d.slug && "bg-brand text-brand-fg hover:text-brand-fg",
          )}
        >
          {d.letter}
          <span className="hidden sm:inline"> · {d.name}</span>
        </Link>
      ))}
      {slug && (
        <>
          <span className="mx-0.5 h-4 w-px bg-edge" />
          <Link
            href={`/mocks/${slug}${isLogin ? "" : "/login"}`}
            className="rounded-full px-3 py-1.5 text-ink transition-colors hover:bg-raised"
          >
            {isLogin ? "→ Landing" : "→ Login"}
          </Link>
        </>
      )}
    </nav>
  );
}
