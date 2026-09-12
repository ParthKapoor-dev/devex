import Image from "next/image";
import Link from "next/link";
import { BookOpen, ExternalLink, Github } from "lucide-react";
import { DevExLogoDark } from "../icons/logo";
import { siteConfig } from "@/lib/site";

const FOOTER_LINKS = [
  { href: "/docs", label: "Documentation" },
  { href: "/docs/quickstart", label: "Quickstart" },
  { href: "/docs/self-hosting", label: "Self-hosting" },
  { href: "/docs/contributing", label: "Contributing" },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-8 w-full pb-8 pt-16 max-md:px-6">
      {/* The glass panel is a single blurred layer. Stacking a second one here
          was the most expensive paint on the page for no visual gain. */}
      <div className="glass mx-auto grid max-w-6xl gap-10 rounded-2xl px-6 py-10 text-left md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Link href="/" className="mb-4 inline-flex items-center gap-2">
            <DevExLogoDark height={32} width={32} />
            <span className="text-gradient-brand text-xl font-semibold tracking-tight">
              DevEx
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-ink-muted">
            An open-source cloud IDE. Spin up live REPLs, code in the browser,
            and get a full terminal — powered by Kubernetes, S3 and Go.
            Self-hostable and Apache-2.0.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-edge bg-raised px-3.5 py-2 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/40 hover:text-ink"
            >
              <Github className="size-4" aria-hidden="true" />
              Contribute
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center gap-2 rounded-lg border border-edge bg-raised px-3.5 py-2 text-sm text-ink-muted transition-colors duration-[--duration-fast] hover:border-brand/40 hover:text-ink"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              Docs
            </Link>
          </div>
        </div>

        <nav aria-labelledby="footer-resources">
          <p
            id="footer-resources"
            className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle"
          >
            Resources
          </p>
          <ul className="space-y-2 text-sm">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-ink-muted transition-colors duration-[--duration-fast] hover:text-brand"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-subtle">
            Maintainer
          </p>
          <a
            href={siteConfig.author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-lg border border-edge bg-raised p-3 transition-colors duration-[--duration-fast] hover:border-brand/40"
          >
            <Image
              src="https://github.com/parthkapoor-dev.png"
              alt=""
              width={40}
              height={40}
              className="rounded-full border border-edge"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium text-ink">
                {siteConfig.author.name}
              </span>
              <span className="flex items-center gap-1 text-xs text-brand">
                parthkapoor.me
                <ExternalLink className="size-3" aria-hidden="true" />
              </span>
            </span>
          </a>
        </div>
      </div>

      <p className="mt-10 text-center text-xs text-ink-subtle">
        &copy; {new Date().getFullYear()} DevEx. Open source and free to use.
      </p>
    </footer>
  );
}
