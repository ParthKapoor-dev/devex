import type { Metadata, Viewport } from "next";
import { display, mono, sans } from "./fonts";
import "./globals.css";
import Header from "@/components/header";
import Providers from "@/providers";
import { siteConfig } from "@/lib/site";
import { token } from "@/lib/tokens";
import { siteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  // Required for `alternates.canonical` and OG image paths to resolve to
  // absolute URLs. Without it Next emits relative URLs and crawlers ignore them.
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.author.name,
  // No `alternates.canonical` here. It is inherited by every route that does
  // not set its own, and it made /login and /dashboard declare themselves
  // copies of the homepage. Pages set their canonical through buildMetadata.
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.title,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  category: "technology",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: token.canvas },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Structured data. Inlined in the body so it ships with the initial
            HTML; crawlers read it without executing anything.

            The site-wide part only — the organization and the website. The
            homepage adds the product and its FAQ; docs pages add the article.
            See lib/seo.ts. */}
        <script
          type="application/ld+json"
          // The payload is built from static config, never user input.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd()) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-brand focus:px-4 focus:py-2 focus:text-brand-fg"
        >
          Skip to content
        </a>
        <Providers>
          <Header />
          <main id="main">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
