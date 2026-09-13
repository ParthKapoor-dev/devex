import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage, ProseSection } from "@/components/marketing/prose-page";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = buildMetadata({
  title: "Privacy",
  description:
    "What DevEx stores, where it stores it, how long it keeps it, and how to get rid of it. Written from the code, not from a template.",
  path: "/privacy",
});

/**
 * Privacy.
 *
 * Written by reading the handlers rather than by filling in a template, so
 * every claim here can be checked against the repository: the session cookie
 * is `oauth-session` because that is `SessionName` in
 * internal/session/manager.go, the magic-link token expires in fifteen minutes
 * because `TokenLifetime` says so, and the workspace prefix is
 * `repl/<user>/<id>/` because services/repl/route.go builds it that way.
 *
 * It is deliberately not legal boilerplate. A page that describes the system
 * accurately is more use to a reader — and more honest — than one that
 * describes a compliance posture the project does not have.
 */
export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="Privacy"
      title="What we store, and for how long."
      lead="Read from the code rather than from a template. Every claim below points at something you can check in the repository."
      updated="13 September 2026"
    >
      <ProseSection title="The short version">
        <p>
          Signing in stores your account identity and a session cookie. Creating
          a workspace stores its files. Nothing is sold, and there is no
          advertising or profiling. Deleting a workspace deletes its files;
          logging out expires the session.
        </p>
      </ProseSection>

      <ProseSection title="What sign-in stores">
        <p>
          <strong className="font-medium text-ink">With GitHub.</strong> The
          OAuth app requests the <code className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em] text-ink">read:user</code> and{" "}
          <code className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em] text-ink">repo</code>{" "}
          scopes — the second so a workspace can clone and push your
          repositories. We keep your numeric ID, login, display name, email
          address and avatar URL, plus the access token, inside a signed session
          cookie named{" "}
          <code className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em] text-ink">oauth-session</code>
          . It is HttpOnly, SameSite=Lax, and expires after seven days.
        </p>
        <p>
          <strong className="font-medium text-ink">With an email link.</strong>{" "}
          We keep your address and a single-use token that expires fifteen
          minutes after it is issued. Requests are rate limited to three per
          address per minute. Magic-link accounts have no GitHub token, so the
          repository features are unavailable on that path.
        </p>
        <p>
          Sign-in mail is delivered by Resend, which necessarily sees the
          recipient address and the message.
        </p>
      </ProseSection>

      <ProseSection title="What a workspace stores">
        <p>
          Each workspace has a record — owner, ID, name, template, and whether
          it is currently running — held in Redis, and a filesystem held in an
          S3-compatible bucket under a prefix derived from your account handle
          and the workspace ID. While a workspace is running, its container is a
          pod on the Kubernetes cluster; stopping it removes the pod and leaves
          the files.
        </p>
        <p>
          Anything you put inside a workspace is stored: source files, installed
          dependencies, and anything a program running in it writes to disk.
          Treat the same way you would treat a shared machine — in particular,
          credentials written into a workspace are stored with it.
        </p>
      </ProseSection>

      <ProseSection title="Deletion and retention">
        <p>
          Deleting a workspace removes its object-storage prefix and its record
          in the same request. That is not recoverable; there is no trash and no
          backup to restore from.
        </p>
        <p>
          Logging out expires the session cookie. To remove an account and
          everything attached to it, delete your workspaces and then open an
          issue or email — account deletion is not yet a button, which is worth
          saying plainly rather than implying otherwise.
        </p>
        <p>
          Revoking the GitHub authorisation from{" "}
          <a
            href="https://github.com/settings/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            your GitHub settings
          </a>{" "}
          invalidates the stored token immediately, from GitHub&rsquo;s side,
          without waiting for us.
        </p>
      </ProseSection>

      <ProseSection title="Analytics and third parties">
        <p>
          This site loads Vercel Analytics, which records page views without
          cookies and without a cross-site identifier. The site itself is hosted
          on Vercel; the control plane, the cluster and the bucket are operated
          by the maintainer. Resend handles sign-in mail. There are no
          advertising, marketing or session-replay scripts, and no third-party
          cookies.
        </p>
      </ProseSection>

      <ProseSection title="Self-hosting">
        <p>
          None of the above applies to a{" "}
          <Link
            href="/docs/self-hosting"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            self-hosted deployment
          </Link>
          . It runs on your cluster, writes to your bucket, and sends mail
          through your own credentials — this project sees none of it.
        </p>
      </ProseSection>

      <ProseSection title="Questions">
        <p>
          Anything unclear or wrong here is a bug in this page. Raise it on{" "}
          <a
            href={`${siteConfig.repo}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline decoration-edge-strong underline-offset-4 transition-colors duration-[--duration-fast] hover:text-brand hover:decoration-brand"
          >
            the issue tracker
          </a>{" "}
          or through the{" "}
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
