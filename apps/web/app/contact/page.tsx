import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { ProsePage, ProseSection } from "@/components/marketing/prose-page";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "How to reach DevEx: the issue tracker for bugs and features, a call for anything commercial, and the maintainer directly for everything else.",
  path: "/contact",
});

/**
 * Contact.
 *
 * Routes rather than a form. A contact form on a one-person open-source
 * project is a worse version of the issue tracker: slower to answer, invisible
 * to everyone else with the same problem, and a place for a report to die
 * quietly. Each route below says what it is for and roughly how long it takes,
 * so the choice is obvious before you make it.
 */

const ROUTES: {
  label: string;
  detail: string;
  href: string;
  action: string;
}[] = [
  {
    label: "A bug, or something missing",
    detail:
      "The issue tracker. Public, searchable, and the only route where someone else hitting the same thing can find your report. Include the workspace template and what you ran.",
    href: `${siteConfig.repo}/issues/new`,
    action: "Open an issue",
  },
  {
    label: "A question about using it",
    detail:
      "Repository discussions, or an issue if you are not sure whether it is a question or a bug. Check the documentation first — most of what gets asked is in the quickstart or the self-hosting guide.",
    href: `${siteConfig.repo}/discussions`,
    action: "Start a discussion",
  },
  {
    label: "Commercial, enterprise or partnership",
    detail:
      "A call. Bring the shape of what you want to run — how many concurrent workspaces, what has to be inside the container, and whether it needs to sit in your own infrastructure.",
    href: siteConfig.links.call,
    action: "Book a call",
  },
  {
    label: "Security",
    detail:
      "Report privately rather than in a public issue: open a GitHub security advisory on the repository, which is visible only to the maintainer until it is fixed.",
    href: `${siteConfig.repo}/security/advisories/new`,
    action: "Report privately",
  },
  {
    label: "Anything else",
    detail:
      "The maintainer's own site has the current direct routes. This is the slowest of the five and the right one for things that do not fit above.",
    href: siteConfig.author.url,
    action: `Reach ${siteConfig.author.name}`,
  },
];

export default function ContactPage() {
  return (
    <ProsePage
      eyebrow="Contact"
      title="Pick the route, not the form."
      lead="DevEx is maintained by one person. Where you send something changes how fast it gets answered and whether anyone else can benefit from the answer, so the routes are listed separately rather than pooled into an inbox."
    >
      <ProseSection title="Five routes">
        <ul className="not-prose divide-y divide-edge overflow-hidden rounded-lg border border-edge">
          {ROUTES.map((route) => (
            <li key={route.label}>
              <a
                href={route.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-6 p-5 transition-colors duration-[--duration-fast] hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-ink">
                    {route.label}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-ink-muted">
                    {route.detail}
                  </span>
                </span>
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 whitespace-nowrap font-mono text-xs text-ink-subtle transition-colors duration-[--duration-fast] group-hover:text-brand">
                  {route.action}
                  <ArrowUpRight
                    className="size-3 transition-transform duration-[--duration-fast] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </ProseSection>

      <ProseSection title="What to expect">
        <p>
          This is not a company with a support rota. Issues are usually looked
          at within a few days; a call is the fastest route to a person. If
          something is broken on the hosted instance, the{" "}
          <a
            href="/ping"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            status page
          </a>{" "}
          checks the cluster, the object store and Redis live — worth a look
          before writing anything up.
        </p>
      </ProseSection>
    </ProsePage>
  );
}
