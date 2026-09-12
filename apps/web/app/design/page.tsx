import type { Metadata } from "next";
import "./palettes.css";
import { PaletteLab } from "@/components/design/palette-lab";
import { buildMetadata } from "@/lib/seo";

// Internal design surface. Never indexed, never in the sitemap.
export const metadata: Metadata = buildMetadata({
  title: "Design lab",
  description: "Internal palette and typography comparison.",
  path: "/design",
  noIndex: true,
});

export default function DesignPage() {
  return <PaletteLab />;
}
