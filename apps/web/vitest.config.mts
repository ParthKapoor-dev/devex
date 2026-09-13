import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

/**
 * Unit tests for pure logic (`lib/`, plus the sitemap and robots.txt handlers). Node environment: no
 * DOM, no rendering, no network.
 *
 * Tests live in `tests/`, outside `app/`, so none of them can ever be picked
 * up as a route.
 */
export default defineConfig({
  resolve: {
    alias: [
      // Mirrors `paths: { "@/*": ["./*"] }` in tsconfig.json.
      { find: /^@\//, replacement: root },
      // `server-only` throws unless resolved under the `react-server`
      // condition, which only Next's server bundler sets. Point it at the
      // package's own no-op file so server modules can be imported here.
      { find: /^server-only$/, replacement: `${root}node_modules/server-only/empty.js` },
    ],
  },
  // tsconfig says `jsx: "preserve"` (Next compiles JSX itself), which the
  // transformer would otherwise follow and leave JSX unparsed. lib/templates.tsx
  // needs it compiled.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
