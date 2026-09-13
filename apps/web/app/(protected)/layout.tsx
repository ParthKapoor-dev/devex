import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

/**
 * Metadata for the signed-in app — the dashboard and every workspace. Their
 * pages are client components, which cannot export metadata themselves.
 *
 * Never indexed: without this they inherited the homepage's title and
 * description. Workspace URLs stay disallowed in robots.txt as well, since
 * each one is ephemeral and private.
 */
export const metadata: Metadata = buildMetadata({
  title: "Dashboard",
  description: "Your DevEx workspaces.",
  path: "/dashboard",
  noIndex: true,
});

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
