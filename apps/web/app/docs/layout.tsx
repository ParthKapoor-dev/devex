import type { Metadata } from "next";
import { getSections } from "@/lib/docs/source";
import { DocsShell } from "@/components/docs/shell";
import AppBackdrop from "@/components/backgrounds/app-backdrop";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Documentation",
  description:
    "Guides and reference for DevEx — cloud development environments on Kubernetes. Quickstart, architecture, templates and self-hosting.",
  path: "/docs",
  titleSuffix: "DevEx docs",
});

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read once here rather than per page: the sidebar is identical across the
  // whole section, and the layout is not re-rendered on navigation.
  const sections = getSections().map((section) => ({
    title: section.title,
    items: section.docs.map((doc) => ({
      title: doc.frontmatter.title,
      url: doc.url,
    })),
  }));

  const searchIndex = getSections().flatMap((section) =>
    section.docs.map((doc) => ({
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      url: doc.url,
      section: section.title,
      // Enough text to match on without shipping the whole corpus.
      excerpt: doc.plain.slice(0, 600),
    })),
  );

  return (
    <>
      {/* The docs were the one surface with no backdrop — flat canvas, while
          the landing page has the shader and every signed-in page has the
          static wash, which made the section read as a different site.
          Rendered here rather than inside DocsShell because the shell is a
          client component and this must stay out of the client bundle. */}
      <AppBackdrop />
      <DocsShell sections={sections} searchIndex={searchIndex}>
        {children}
      </DocsShell>
    </>
  );
}
