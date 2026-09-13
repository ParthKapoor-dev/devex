import Link from "next/link";
import { ArrowUpRight, BookOpen, Github } from "lucide-react";
import { DevExLogoDark } from "../icons/logo";
import { siteConfig } from "@/lib/site";

/**
 * The footer.
 *
 * Rebuilt on the tokens. It was the last file on the marketing site still
 * written in raw Tailwind from two brands ago — `emerald-300`, `teal-400`,
 * `teal-500/20`, `gray-300`, `gray-500`, `gray-600/30`, `black/20`, `black/30`
 * — so the wordmark rendered as a green gradient on a page whose accent is
 * amber, and the borders were a grey unrelated to `edge`.
 *
 * It also had no links in it. A footer's actual job is to be the index of the
 * site for anyone who reached the bottom without finding what they wanted, and
 * this one offered two buttons. It has columns now.
 *
 * A server component: the year is computed at build time, which is also the
 * fix for the copyright being hardcoded to 2025.
 */

const COLUMNS: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Start a workspace", href: "/login" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Pricing", href: "/pricing" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Status", href: "/ping" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Introduction", href: "/docs" },
      { label: "Quickstart", href: "/docs/quickstart" },
      { label: "Architecture", href: "/docs/architecture" },
      { label: "Self-hosting", href: "/docs/self-hosting" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source", href: siteConfig.repo, external: true },
      {
        label: "Contributing",
        href: "/docs/contributing",
      },
      { label: "MCP server", href: "/docs/mcp" },
      { label: "Book a call", href: siteConfig.links.call, external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      // The index an agent reads first. A footer is where a person looks for
      // the site map; this is the same thing for everything that is not one.
      { label: "llms.txt", href: "/llms.txt" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 px-6">
      <div className="mx-auto max-w-5xl border-t border-edge py-14">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          {/* Identity */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <DevExLogoDark height={28} width={28} />
              <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink">
                devX
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
              Open-source cloud development environments. Containerised REPLs on
              Kubernetes with a real terminal, a real filesystem and files that
              persist — self-hostable, and yours to read.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href={siteConfig.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-edge px-3 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Github className="size-4" aria-hidden="true" />
                Contribute
              </a>
              <Link
                href="/docs"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-edge px-3 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-edge-strong hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <BookOpen className="size-4" aria-hidden="true" />
                Docs
              </Link>
            </div>
          </div>

          {/* Index */}
          <nav
            aria-label="Footer"
            className="grid grid-cols-2 gap-8 sm:grid-cols-4"
          >
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="label mb-4 text-ink-subtle">{column.title}</h2>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:text-ink"
                        >
                          {link.label}
                          <ArrowUpRight
                            className="size-3 text-ink-subtle"
                            aria-hidden="true"
                          />
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:text-ink"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col-reverse items-start gap-4 border-t border-edge pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-ink-subtle">
            © {new Date().getFullYear()} devX · MIT
          </p>

          <a
            href={siteConfig.author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 rounded-md border border-edge py-1.5 pl-1.5 pr-3 transition-colors duration-[--duration-fast] hover:border-edge-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://github.com/parthkapoor-dev.png"
              alt=""
              width={28}
              height={28}
              loading="lazy"
              className="size-7 rounded-full object-cover"
            />
            <span className="leading-tight">
              <span className="block text-xs text-ink-subtle">Built by</span>
              <span className="block text-sm font-medium text-ink transition-colors duration-[--duration-fast] group-hover:text-brand">
                {siteConfig.author.name}
              </span>
            </span>
            <ArrowUpRight
              className="size-3.5 text-ink-subtle transition-[transform,color] duration-[--duration-fast] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand"
              aria-hidden="true"
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
