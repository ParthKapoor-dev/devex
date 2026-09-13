import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import AppBackdrop from "@/components/backgrounds/app-backdrop";

/**
 * 404.
 *
 * The old one was a shadcn Card in dashed borders on `bg-background`, from
 * before the redesign — the wrong greys, the wrong radius, a font stack
 * unrelated to the rest of the site, and a single button reading `$ cd /home`.
 *
 * The shell framing was the right instinct for this product and is kept, but
 * as a real transcript: a command, its exit status, and the thing you would
 * actually type next. `ls` is a link list, because on a 404 the useful
 * response is not sympathy, it is the index.
 *
 * The index is also for machines. An agent that follows a dead link should be
 * able to recover from the response body rather than give up on the host, so
 * the sitemap and llms.txt are in it alongside the human routes. Next serves
 * this with a real HTTP 404 — the status is what stops a crawler concluding
 * that every path on the site exists.
 */

const ROUTES: { path: string; note: string; external?: boolean }[] = [
  { path: "/", note: "the landing page" },
  { path: "/docs", note: "guides and reference" },
  { path: "/#pricing", note: "plans and limits" },
  { path: "/dashboard", note: "your workspaces" },
  { path: "/ping", note: "live status of the cluster" },
];

const MACHINE_ROUTES: { path: string; note: string }[] = [
  { path: "/sitemap.xml", note: "every public URL" },
  { path: "/llms.txt", note: "the index, for agents" },
  { path: "/openapi.json", note: "the API, described" },
];

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center px-6 py-24">
      <AppBackdrop />

      <div className="relative z-10 w-full max-w-xl">
        <div className="overflow-hidden rounded-lg border border-edge bg-surface">
          {/* Title bar */}
          <div className="flex items-center justify-between border-b border-edge px-4 py-2.5">
            <span className="label text-ink-subtle">devx</span>
            <span className="font-mono text-xs text-danger">exit 404</span>
          </div>

          <div className="space-y-5 p-5 font-mono text-sm">
            <p className="flex gap-2">
              <span aria-hidden="true" className="text-ink-subtle">
                $
              </span>
              <span className="text-ink">open</span>
            </p>
            <p className="pl-5 leading-relaxed text-ink-muted">
              No such page. It may have been renamed, or the link that sent you
              here was written against an older version of the site.
            </p>

            <p className="flex gap-2 pt-1">
              <span aria-hidden="true" className="text-ink-subtle">
                $
              </span>
              <span className="text-ink">ls /</span>
            </p>

            <ul className="space-y-1.5 pl-5">
              {ROUTES.map((route) => (
                <li key={route.path}>
                  <Link
                    href={route.path}
                    className="group inline-flex items-baseline gap-3 rounded-sm transition-colors duration-[--duration-fast] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="text-ink-muted underline decoration-edge-strong underline-offset-4 group-hover:text-brand group-hover:decoration-brand">
                      {route.path}
                    </span>
                    <span className="text-xs text-ink-subtle">
                      {route.note}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            {/* The same index, for whatever is not a person. Visible rather
                than hidden: these are useful links either way, and a reader
                who wants the sitemap should not have to guess at it. */}
            <p className="flex gap-2 pt-1">
              <span aria-hidden="true" className="text-ink-subtle">
                $
              </span>
              <span className="text-ink">ls /--machine-readable</span>
            </p>

            <ul className="space-y-1.5 pl-5">
              {MACHINE_ROUTES.map((route) => (
                <li key={route.path}>
                  <a
                    href={route.path}
                    className="group inline-flex items-baseline gap-3 rounded-sm transition-colors duration-[--duration-fast] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  >
                    <span className="text-ink-muted underline decoration-edge-strong underline-offset-4 group-hover:text-brand group-hover:decoration-brand">
                      {route.path}
                    </span>
                    <span className="text-xs text-ink-subtle">
                      {route.note}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-edge px-5 py-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-sm text-ink transition-colors duration-[--duration-fast] hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Back to the start
              <ArrowUpRight
                className="size-3.5 text-ink-subtle transition-[transform,color] duration-[--duration-fast] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
