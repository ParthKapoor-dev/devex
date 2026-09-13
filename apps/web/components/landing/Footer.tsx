import Link from "next/link";
import { ArrowUpRight, Github, MessagesSquare } from "lucide-react";
import { DevExLogoDark } from "../icons/logo";
import { siteConfig } from "@/lib/site";

/**
 * The footer: the site's index, and a signature.
 *
 * Three layers, top to bottom — identity and the link index; a giant outlined
 * wordmark that the page ends on; and a tmux-style status line carrying the
 * licence, the status page and the author. The status line is the same device
 * as the hero's, so the page closes the way it opened.
 *
 * Used on every marketing page, so nothing in it is landing-specific. A server
 * component: the year is computed at build time.
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
      { label: "Pricing", href: "/#pricing" },
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
      { label: "MCP server", href: "/docs/mcp" },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source", href: siteConfig.repo, external: true },
      { label: "Discord", href: siteConfig.links.discord, external: true },
      { label: "Contributing", href: "/docs/contributing" },
      { label: "Book a call", href: siteConfig.links.call, external: true },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy", href: "/privacy" },
      // The index an agent reads first.
      { label: "llms.txt", href: "/llms.txt" },
    ],
  },
];

const link =
  "rounded-xs text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

const chip =
  "inline-flex h-9 items-center gap-2 rounded-sm border border-edge px-3 font-mono text-xs text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 overflow-hidden border-t border-edge">
      <div className="mx-auto max-w-6xl px-5 pt-16 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <DevExLogoDark height={28} width={28} />
              <span className="font-display text-lg font-medium tracking-[-0.02em] text-ink">devX</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-muted">
              Open-source cloud development environments. A real container, a
              real terminal and files that persist — in a browser tab, or on
              your own cluster.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a href={siteConfig.repo} target="_blank" rel="noopener noreferrer" className={chip}>
                <Github className="size-3.5" aria-hidden="true" />
                parthkapoor-dev/devex
              </a>
              <a href={siteConfig.links.discord} target="_blank" rel="noopener noreferrer" className={chip}>
                <MessagesSquare className="size-3.5" aria-hidden="true" />
                join the discord
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="mb-4 font-mono text-xs text-ink-subtle">
                  <span className="text-brand/70">{"// "}</span>
                  {column.title.toLowerCase()}
                </h2>
                <ul className="space-y-2.5">
                  {column.links.map((item) => (
                    <li key={item.label}>
                      {item.external ? (
                        <a href={item.href} target="_blank" rel="noopener noreferrer" className={`${link} inline-flex items-center gap-1`}>
                          {item.label}
                          <ArrowUpRight className="size-3 text-ink-subtle" aria-hidden="true" />
                        </a>
                      ) : (
                        <Link href={item.href} className={link}>
                          {item.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* The signature. Outlined display type, cropped by the status line so
          it reads as something the page is sitting on. Decorative. */}
      <div aria-hidden="true" className="relative mx-auto mt-10 max-w-6xl select-none px-5 sm:px-8">
        <p
          className="translate-y-[18%] font-display text-[clamp(5rem,24vw,20rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-transparent"
          style={{
            WebkitTextStroke: "1px color-mix(in oklab, var(--color-brand) 70%, transparent)",
            backgroundImage:
              "linear-gradient(to bottom, color-mix(in oklab, var(--color-brand) 28%, transparent), transparent 80%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
          }}
        >
          devex
        </p>
      </div>

      <div className="relative border-t border-brand/15 bg-canvas">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-subtle sm:px-8">
          <span className="bg-brand px-1.5 text-brand-fg">0:devex*</span>
          <span>© {new Date().getFullYear()} DevEx · MIT</span>
          <Link href="/ping" className="inline-flex items-center gap-2 hover:text-ink">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-term-accent shadow-[0_0_8px_var(--color-term-accent)]"
            />
            status
          </Link>
          <a
            href={siteConfig.author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex items-center gap-2 normal-case tracking-normal hover:text-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://github.com/parthkapoor-dev.png"
              alt=""
              width={18}
              height={18}
              loading="lazy"
              className="size-[18px] rounded-full object-cover"
            />
            built by {siteConfig.author.name}
          </a>
        </div>
      </div>
    </footer>
  );
}
