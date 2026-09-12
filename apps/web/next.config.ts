import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import { shikiTheme } from "./lib/docs/shiki-theme";
import { linkHeaderValue } from "./lib/agents";
import type { NextConfig } from "next";

/** RFC 8288 discovery, computed once at config load. See lib/agents.ts. */
const agentLinkHeader = linkHeaderValue();

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

  async redirects() {
    return [
      {
        // `/demo` used to be a client component that called `router.push` with
        // a YouTube *embed* URL — which the Next router cannot navigate to, so
        // the page said "Redirecting to yt demo" and then sat there. Nothing
        // in the app linked to it (the hero opens the video in a dialog), but
        // the path may be written down elsewhere, so it redirects properly
        // instead of 404ing.
        source: "/demo",
        destination: "https://www.youtube.com/watch?v=Tlck20bJeFE",
        permanent: false,
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/:path*`,
      },
      // Markdown twins. `/docs/quickstart.md` is the same page as
      // `/docs/quickstart`, served as text/markdown for anything that reads
      // rather than renders.
      //
      // A rewrite and not a route, because a Next dynamic segment is a whole
      // path component: there is no way to spell "[slug] followed by .md".
      // `/index.md` and `/pricing.md` are real handlers and are matched first
      // — an array returned from rewrites() is checked after filesystem
      // routes, which is exactly the precedence this needs.
      { source: "/docs/:slug*.md", destination: "/md/docs/:slug*" },
      // The App Router will not route a directory whose name starts with a
      // dot, so the /.well-known documents are authored under /well-known and
      // rewritten onto their real paths.
      { source: "/.well-known/:path*", destination: "/well-known/:path*" },
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
          // RFC 8288. Tells anything that fetched a page what else this site
          // publishes for machines, without it having to guess at paths. The
          // value is built from lib/agents.ts so it cannot drift from the
          // documents it advertises.
          { key: "Link", value: agentLinkHeader },
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
          // One theme, not a light/dark pair: the docs are dark-only, and a
          // pair makes rehype-pretty-code emit both sets of inline colours on
          // every token, which roughly doubles the HTML of a code block.
          // It matches the editor's theme — see lib/docs/shiki-theme.ts.
          theme: shikiTheme,
          keepBackground: false,
          defaultLang: "text",
        },
      ],
    ],
  },
});

export default withMDX(nextConfig);
