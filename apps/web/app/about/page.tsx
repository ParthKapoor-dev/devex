import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseSection } from "@/components/marketing/prose-page";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "DevEx is an open-source cloud development environment: containerised workspaces on Kubernetes with a real shell, persistent files and public ports. Built in the open, Apache-2.0.",
  path: "/about",
});

/**
 * About.
 *
 * The page that answers "is this a real thing and who is behind it" — the one
 * a reader checks before trusting a tool with their work, and the one an
 * answer engine checks before recommending it. It had never existed.
 *
 * No claims here that are not true of the running system: one maintainer, one
 * cluster, an Apache-2.0 repository, and a free tier with the actual limits.
 */
export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="About"
      title="A real machine, run in the open."
      lead="DevEx gives you a container on a Kubernetes cluster and puts it in a browser tab. Every part of it is public — the control plane, the runner, the templates and this site."
    >
      <ProseSection title="What it is">
        <p>
          A DevEx workspace is one unprivileged pod, started from a template. It
          has a shell with a package manager and outbound network, a filesystem
          synced to object storage so it survives being stopped, a browser
          editor, and a public URL for anything you serve from inside it. There
          is no emulator layer and no restricted API in the middle: when you run{" "}
          <code className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em] text-ink">
            npm install
          </code>{" "}
          it is a real install, into a real container, over the real internet.
        </p>
        <p>
          That is a deliberately unfashionable design. Most browser development
          tools of the last few years chose a sandbox — faster to start, cheaper
          to run, and unable to do the one thing you eventually need, which is
          to run the actual thing and see the actual error.
        </p>
      </ProseSection>

      <ProseSection title="Why it exists">
        <p>
          Setting up a development environment is still the slowest part of
          picking up someone else&rsquo;s project, and the least interesting.
          The gap between &ldquo;I can read this code&rdquo; and &ldquo;I can
          run this code&rdquo; is measured in hours and paid by every new
          contributor, every reviewer checking out a branch, and every person
          following a tutorial on a laptop configured differently from the
          author&rsquo;s.
        </p>
        <p>
          A workspace defined by a template closes that gap to about twenty
          seconds, and closes it the same way for everyone. The same property is
          what makes it useful to an AI agent: an assistant that can execute
          what it wrote and read the error is doing engineering, and one that
          can only print code is guessing.
        </p>
      </ProseSection>

      <ProseSection title="How it is built">
        <p>
          Four pieces, all in one repository. A Next.js web application — this
          site, the dashboard and the browser IDE. A Go control plane that
          handles authentication, schedules workspaces onto Kubernetes and
          copies template filesystems in and out of S3-compatible storage. A Go
          runner that lives inside each workspace and exposes its filesystem and
          shell over WebSockets. And an MCP server that hands those same
          capabilities to an AI assistant as tools.
        </p>
        <p>
          The{" "}
          <Link
            href="/docs/architecture"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            architecture guide
          </Link>{" "}
          walks through how a click on &ldquo;start&rdquo; becomes a running
          pod, and{" "}
          <Link
            href="/docs/self-hosting"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            self-hosting
          </Link>{" "}
          covers running the whole stack on a cluster of your own.
        </p>
      </ProseSection>

      <ProseSection title="Who runs it">
        <p>
          DevEx is built and maintained by{" "}
          <a
            href={siteConfig.author.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            {siteConfig.author.name}
          </a>
          . It is a one-person project running on a single cluster, which is
          worth knowing before you put anything critical on the hosted instance:
          there is no on-call rotation behind it. The free tier is genuinely
          free and needs no card, the source is Apache-2.0, and self-hosting is
          unlimited — so nothing here depends on that cluster staying up
          forever.
        </p>
        <p>
          Bugs and feature requests belong in{" "}
          <a
            href={`${siteConfig.repo}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            the issue tracker
          </a>
          ; everything else is on the{" "}
          <Link
            href="/contact"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            contact page
          </Link>
          .
        </p>
      </ProseSection>
    </ProsePage>
  );
}
