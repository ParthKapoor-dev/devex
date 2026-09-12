import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import type { NextConfig } from "next";

/**
 * NOTE: this app builds on webpack, not Turbopack, because of MDX.
 *
 * `@next/mdx` on the Next 15 line hands its plugin list straight to
 * `@mdx-js/loader`, which needs real plugin functions. Turbopack serialises
 * loader options across a process boundary, so an imported function arrives as
 * `null` ("Cannot use 'in' operator to search for 'plugins' in null"), and the
 * string form Turbopack would accept is not resolved by this loader version.
 *
 * `experimental.mdxRs` is Turbopack-compatible but runs the Rust MDX compiler,
 * which does not accept arbitrary remark/rehype plugins — that would cost
 * build-time syntax highlighting, frontmatter exports and heading anchors.
 *
 * So `npm run dev` omits `--turbopack`. Revisit on Next 16, where `@next/mdx`
 * resolves string plugin names.
 */
const nextConfig: NextConfig = {
  pageExtensions: ["ts", "tsx", "md", "mdx"],

  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "raw.githubusercontent.com" },
      // Profile pictures are served from the apex host: github.com/<user>.png
      { protocol: "https", hostname: "github.com" },
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/:path*`,
      },
    ];
  },

  output: "standalone",

  async headers() {
    return [
      {
        // Hashed build assets are genuinely immutable.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // Docs pages are NOT immutable — they are prose that gets corrected.
        // The previous `max-age=31536000, immutable` meant a returning reader
        // could not see a fix for a year. Revalidate instead: serve instantly
        // from cache, refresh in the background.
        source: "/docs/:path*",
        headers: [
          {
            key: "Cache-Control",
            value:
              "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [
      remarkGfm,
      remarkFrontmatter,
      // Re-exports YAML frontmatter as a named `frontmatter` export per page.
      [remarkMdxFrontmatter, { name: "frontmatter" }],
    ],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
      [
        rehypePrettyCode,
        {
          // Shiki runs at build time, so no highlighter JS reaches the browser.
          theme: { dark: "github-dark-default", light: "github-light" },
          keepBackground: false,
          defaultLang: "text",
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
