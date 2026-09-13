import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { token } from "@/lib/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: token.canvas,
    theme_color: token.brand500,
    categories: ["developer", "productivity"],
    icons: [{ src: "/logo.png", sizes: "any", type: "image/png" }],
  };
}
