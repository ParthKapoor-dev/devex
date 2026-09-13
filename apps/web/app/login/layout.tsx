import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

/**
 * The sign-in flow is a client page, so its metadata lives here.
 *
 * Not indexed, but crawlable: robots.txt used to disallow /login, which hid
 * this `noindex` from Google while every "Start a workspace" button linked
 * to the URL — the recipe for a bare, description-less result.
 */
export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to DevEx with GitHub or a one-time link by email.",
  path: "/login",
  noIndex: true,
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
