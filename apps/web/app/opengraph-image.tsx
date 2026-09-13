import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";
import { token } from "@/lib/tokens";

// No `runtime = "edge"`: this app deploys as `output: "standalone"` on Node,
// and declaring edge here opts the route out of static generation, so the card
// would be rendered on every crawl instead of once at build time.
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Read once at build; Satori takes images as data URIs. */
const LOGO = `data:image/png;base64,${readFileSync(
  path.join(process.cwd(), "public", "logo.png"),
).toString("base64")}`;

/**
 * The default social card.
 *
 * Rendered at build/request time by Satori, which supports only a subset of
 * CSS — no CSS variables, no `gap` shorthand edge cases, no external
 * stylesheets. Colours therefore come from `lib/tokens`, which holds the hex
 * mirrors of the `--ds-*` values.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: token.canvas,
          backgroundImage:
            "radial-gradient(900px 500px at 50% -10%, rgba(254,154,0,0.20), transparent 65%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* The real mark, the same file the favicon uses — the card had a
              placeholder "D" in an amber square. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} width={56} height={56} alt="" />
          <div style={{ fontSize: 34, fontWeight: 700, color: token.ink }}>
            DevEx
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: token.ink,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: 960,
            }}
          >
            Open-source cloud development environments
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 30,
              color: token.inkMuted,
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            A code editor, a real terminal and a public URL — every workspace
            its own container on Kubernetes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: 28,
            fontSize: 24,
            color: token.inkSubtle,
          }}
        >
          <div style={{ display: "flex" }}>github.com/parthkapoor-dev/devex</div>
          <div style={{ display: "flex", color: token.brand500 }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
