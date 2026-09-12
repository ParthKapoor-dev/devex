import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

// No `runtime = "edge"`: this app deploys as `output: "standalone"` on Node,
// and declaring edge here opts the route out of static generation, so the card
// would be rendered on every crawl instead of once at build time.
export const alt = siteConfig.title;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The default social card.
 *
 * Rendered at build/request time by Satori, which supports only a subset of
 * CSS — no CSS variables, no `gap` shorthand edge cases, no external stylesheets.
 * Colours are therefore literal hex values mirroring the brand tokens.
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
          background: "#0a0a0a",
          backgroundImage:
            "radial-gradient(900px 500px at 50% -10%, rgba(16,185,129,0.22), transparent 65%)",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 700,
              color: "#0a0a0a",
            }}
          >
            D
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#fafafa" }}>
            DevEx
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 68,
              fontWeight: 800,
              color: "#fafafa",
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
              color: "#a1a1aa",
              lineHeight: 1.4,
              maxWidth: 900,
            }}
          >
            Containerised REPLs in your browser. Kubernetes-native and
            self-hostable.
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
            color: "#71717a",
          }}
        >
          <div style={{ display: "flex" }}>github.com/parthkapoor-dev/devex</div>
          <div style={{ display: "flex", color: "#10b981" }}>
            {siteConfig.url.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
