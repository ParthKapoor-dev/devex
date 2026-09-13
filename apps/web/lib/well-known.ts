import {
  AGENT_IDENTITY,
  AGENT_SUMMARY,
  AGENT_SURFACES,
  API_ORIGIN,
  WHEN_TO_USE,
} from "@/lib/agents";
import { absoluteUrl, siteConfig } from "@/lib/site";

/**
 * The `/.well-known` discovery documents.
 *
 * Three catalogues, three specs, one set of facts. What they have in common is
 * the rule that they only list things that exist: an ARD catalogue advertising
 * a hosted MCP endpoint we do not run would fail its own reachability check and
 * would waste the time of anything that believed it.
 *
 * That is why the MCP server appears here as documentation and a source
 * repository rather than as a `serverUrl`. It is a real server — but an
 * opt-in sidecar, reached per workspace at `/mcp/<repl-id>`, so there is no one
 * public URL to point at. When there is one, it gets a `serverUrl` and an
 * `/.well-known/mcp/server-card.json`, and not before.
 *
 * Served through `app/well-known/*` and rewritten from `/.well-known/*` in
 * next.config.ts, because the App Router will not route a directory whose name
 * begins with a dot.
 */

/* -------------------------------------------------------------------------- */
/* Agentic Resource Discovery — agenticresourcediscovery.org                  */
/* -------------------------------------------------------------------------- */

export function ardCatalog() {
  return {
    version: "0.1",
    name: AGENT_IDENTITY.name,
    description: AGENT_SUMMARY,
    homepage: siteConfig.url,
    license: AGENT_IDENTITY.license,
    updated: new Date().toISOString().slice(0, 10),
    resources: [
      {
        type: "api",
        name: "DevEx control plane",
        description:
          "REST API for creating, starting, stopping and deleting workspaces. `GET /ping` and `GET /auth/status` are open; everything else needs a browser session cookie.",
        url: API_ORIGIN,
        specification: absoluteUrl("/openapi.json"),
        specificationFormat: "openapi-3.1",
        authentication: "session-cookie",
      },
      {
        type: "documentation",
        name: "DevEx documentation",
        description:
          "Guides for getting a workspace running, the template format, the architecture, and self-hosting on your own cluster.",
        url: absoluteUrl("/docs"),
        index: absoluteUrl("/docs/llms.txt"),
        fullText: absoluteUrl("/llms-full.txt"),
      },
      {
        type: "mcp-server",
        name: "DevEx MCP server",
        description:
          "An optional sidecar beside a workspace that lets an assistant read its files over the Model Context Protocol. Tools today: Ping and read_file. Streamable HTTP at /mcp/<repl-id> on the workspace's host, when the operator enables it.",
        transport: "streamable-http",
        documentation: absoluteUrl("/docs/mcp"),
        source: `${siteConfig.repo}/tree/main/apps/mcp`,
        tools: ["Ping", "read_file"],
      },
    ],
    contact: { name: siteConfig.author.name, url: siteConfig.author.url },
  };
}

/* -------------------------------------------------------------------------- */
/* API catalogue — RFC 9727                                                   */
/* -------------------------------------------------------------------------- */

export const API_CATALOG_CONTENT_TYPE =
  'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"';

export function apiCatalog() {
  return {
    linkset: [
      {
        anchor: API_ORIGIN,
        "service-desc": [
          {
            href: absoluteUrl("/openapi.json"),
            type: "application/json",
            title: "OpenAPI 3.1 description of the DevEx API",
          },
        ],
        "service-doc": [
          {
            href: absoluteUrl("/docs/architecture"),
            type: "text/html",
            title: "How the control plane, runner and storage fit together",
          },
        ],
        "service-meta": [
          {
            href: absoluteUrl("/.well-known/ard.json"),
            type: "application/json",
            title: "Agentic Resource Discovery catalogue",
          },
        ],
        status: [
          {
            href: `${API_ORIGIN}/ping`,
            type: "application/json",
            title: "Live health of the control plane and its dependencies",
          },
        ],
      },
    ],
  };
}

/* -------------------------------------------------------------------------- */
/* Agent skills index                                                         */
/* -------------------------------------------------------------------------- */

/**
 * What an agent can actually get done here, in the agent's own terms.
 *
 * Each entry says what the capability is, how to reach it, and — the part that
 * makes it worth publishing — whether a program can use it unattended today.
 * Two of these need a browser session, and saying so up front is more useful
 * than letting something discover it at the 401.
 */
export function agentSkillsIndex() {
  return {
    version: "1.0",
    name: `${AGENT_IDENTITY.name} capabilities`,
    description: AGENT_SUMMARY,
    homepage: siteConfig.url,
    whenToUse: WHEN_TO_USE,
    skills: [
      {
        name: "check-platform-health",
        description:
          "Read whether the DevEx control plane, its Kubernetes cluster, its object store and its Redis are reachable.",
        endpoint: `${API_ORIGIN}/ping`,
        method: "GET",
        authentication: "none",
        specification: `${absoluteUrl("/openapi.json")}#/paths/~1ping/get`,
      },
      {
        name: "read-documentation",
        description:
          "Fetch any DevEx documentation page as markdown — append `.md` to its path, or take the whole manual from /llms-full.txt in one request.",
        endpoint: absoluteUrl("/llms-full.txt"),
        method: "GET",
        authentication: "none",
      },
      {
        name: "compare-pricing",
        description:
          "Read the plans, their Kubernetes resource limits and their prices as a markdown table.",
        endpoint: absoluteUrl("/pricing.md"),
        method: "GET",
        authentication: "none",
      },
      {
        name: "manage-workspaces",
        description:
          "Create, list, start, stop and delete containerised development workspaces.",
        endpoint: `${API_ORIGIN}/api/repl/`,
        method: "GET, POST, DELETE",
        authentication: "session-cookie",
        note: "Needs a browser session obtained through GitHub OAuth or an emailed link. There is no API key today, so this is not usable unattended.",
        specification: absoluteUrl("/openapi.json"),
      },
      {
        name: "run-code-in-a-workspace",
        description:
          "Read files inside a live workspace over the Model Context Protocol. Writing files and running commands are planned.",
        transport: "streamable-http",
        authentication: "none — the sidecar is experimental and opt-in",
        documentation: absoluteUrl("/docs/mcp"),
        source: `${siteConfig.repo}/tree/main/apps/mcp`,
        tools: ["Ping", "read_file"],
      },
    ],
    surfaces: AGENT_SURFACES.map(({ path, title, type }) => ({
      url: absoluteUrl(path),
      title,
      type,
    })),
  };
}
