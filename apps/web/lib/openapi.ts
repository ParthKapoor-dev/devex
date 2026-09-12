import { API_ORIGIN } from "@/lib/agents";
import { siteConfig } from "@/lib/site";

/**
 * OpenAPI 3.1 description of the DevEx control-plane API.
 *
 * Hand-written against the Go handlers in `apps/core` — `cmd/api/api.go` for
 * the mounts, then `services/auth`, `services/repl` and `services/runner` for
 * the routes under each. It documents what those handlers *do*, including the
 * places where that is not what you would design today: `POST /api/repl/new`
 * answers 200 with the JSON string `"Success"`, and the free-tier limit comes
 * back as a 500 rather than a 402 or 429. Both are recorded here as they are.
 * A spec that describes an idealised API is worse than none — an agent will
 * believe it.
 *
 * Why this lives in the web app: the audit looks for `/openapi.json` on the
 * site origin, and this is documentation, not behaviour. Nothing in `apps/core`
 * changes because this file exists. It does mean the two can drift, so the
 * operation list is small and the descriptions say where the truth is.
 *
 * Every operation carries a unique `operationId` and a description, which is
 * what makes the spec usable as a function-calling tool definition.
 */

const USER_SCHEMA = {
  type: "object",
  description: "The signed-in account. GitHub sign-in fills every field; magic-link sign-in leaves `login` derived from the address and `avatar_url` empty.",
  properties: {
    id: { type: "integer", format: "int64", description: "GitHub numeric user ID, or a generated ID for magic-link accounts." },
    login: { type: "string", description: "Account handle. Lowercased and used as the storage prefix for every workspace.", examples: ["parthkapoor-dev"] },
    name: { type: "string", description: "Display name." },
    email: { type: "string", format: "email" },
    avatar_url: { type: "string", format: "uri", description: "Profile image. Empty for magic-link accounts." },
    created_at: { type: "string", format: "date-time" },
  },
  required: ["id", "login"],
} as const;

const REPL_SCHEMA = {
  type: "object",
  description: "A workspace. `id` is the stable handle; `isActive` says whether a pod is currently scheduled for it.",
  properties: {
    user: { type: "string", description: "Owning account handle, lowercased." },
    id: { type: "string", description: "Workspace ID.", examples: ["repl-9f1c1c2e-0b1a-4f0f-9c3a-7d2e6a1b8c40"] },
    name: { type: "string", description: "Human-chosen name, unique per account.", examples: ["api"] },
    template: { type: "string", enum: ["node", "python", "go"], description: "Template the filesystem was seeded from." },
    isActive: { type: "boolean", description: "True while a Kubernetes Deployment exists for this workspace." },
  },
  required: ["user", "id", "name", "template", "isActive"],
} as const;

const ERROR_SCHEMA = {
  type: "object",
  description: "Every failure from this API has this shape.",
  properties: { error: { type: "string", description: "Human-readable reason." } },
  required: ["error"],
} as const;

function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  };
}

const SESSION_AUTH = [{ sessionCookie: [] }];

export function openApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "DevEx API",
      version: "1.0.0",
      summary: "Create, start, stop and delete containerised development workspaces on Kubernetes.",
      description: [
        "The control plane behind " + siteConfig.url + ".",
        "",
        "Two endpoints are open to anyone: `GET /ping` reports whether the cluster, object store and Redis are reachable, and `GET /auth/status` reports whether the caller has a session. Everything else needs one.",
        "",
        "Authentication is a signed session cookie (`oauth-session`, HttpOnly, SameSite=Lax, seven days), obtained through GitHub OAuth or a single-use email link. There is no API key or bearer token: the API is designed for the first-party web client, and CORS is restricted to it. An agent can read this description and the public endpoints; it cannot currently drive a workspace without a browser session.",
        "",
        "Source: " + siteConfig.repo + " (Apache-2.0).",
      ].join("\n"),
      license: { name: "Apache-2.0", identifier: "Apache-2.0" },
      contact: { name: siteConfig.author.name, url: siteConfig.author.url },
    },
    servers: [{ url: API_ORIGIN, description: "Production control plane." }],
    externalDocs: { description: "Architecture", url: `${siteConfig.url}/docs/architecture` },
    tags: [
      { name: "Health", description: "Liveness of the control plane and its dependencies." },
      { name: "Authentication", description: "Session lifecycle. GitHub OAuth and email magic links." },
      { name: "Workspaces", description: "Create, list, start, stop and delete workspaces." },
      { name: "Runner", description: "Called by a runner pod to retire its own session. Not for general use." },
    ],
    paths: {
      "/ping": {
        get: {
          operationId: "getHealth",
          tags: ["Health"],
          summary: "Health of the control plane and its dependencies",
          description: "Probes Kubernetes, the S3-compatible bucket and Redis in parallel. Always answers 200: `api` is `ok` or `degraded`, and each dependency is either `ok` or the error string it failed with. No authentication.",
          security: [],
          responses: {
            "200": {
              description: "Status of each dependency.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      api: { type: "string", enum: ["ok", "degraded"] },
                      k8s: { type: "string", description: "`ok`, or the error." },
                      s3: { type: "string", description: "`ok`, or the error." },
                      redis: { type: "string", description: "`ok`, or the error." },
                    },
                    required: ["api", "k8s", "s3", "redis"],
                  },
                  examples: { healthy: { value: { api: "ok", k8s: "ok", redis: "ok", s3: "ok" } } },
                },
              },
            },
          },
        },
      },

      "/auth/status": {
        get: {
          operationId: "getAuthStatus",
          tags: ["Authentication"],
          summary: "Whether the caller has a valid session",
          description: "Answers 200 either way. Without a session the body is `{\"authenticated\": false}`; with one it also carries the user and the session expiry. This is the cheapest way to find out whether a cookie is still good. No authentication required.",
          security: [],
          responses: {
            "200": {
              description: "Session state.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      authenticated: { type: "boolean" },
                      user: { $ref: "#/components/schemas/User" },
                      token_expires_at: { type: "string", format: "date-time" },
                    },
                    required: ["authenticated"],
                  },
                  examples: {
                    anonymous: { value: { authenticated: false } },
                  },
                },
              },
            },
          },
        },
      },

      "/auth/me": {
        get: {
          operationId: "getCurrentUser",
          tags: ["Authentication"],
          summary: "The signed-in account",
          security: SESSION_AUTH,
          responses: {
            "200": {
              description: "The account behind the session cookie.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } },
            },
            "401": { description: "No session, or the session expired. Body is `Unauthorized` as plain text." },
          },
        },
      },

      "/auth/logout": {
        post: {
          operationId: "logout",
          tags: ["Authentication"],
          summary: "Clear the session",
          description: "Expires the session cookie. Safe to call without one.",
          security: SESSION_AUTH,
          responses: {
            "200": {
              description: "Session cleared.",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
                },
              },
            },
          },
        },
      },

      "/auth/github/login": {
        get: {
          operationId: "startGithubLogin",
          tags: ["Authentication"],
          summary: "Begin GitHub OAuth",
          description: "Redirects to GitHub's consent screen. Browser-only: the callback sets a cookie on this origin. Requests `read:user` and `repo` so that workspaces can clone and push.",
          security: [],
          responses: { "302": { description: "Redirect to github.com." } },
        },
      },

      "/auth/github/callback": {
        get: {
          operationId: "completeGithubLogin",
          tags: ["Authentication"],
          summary: "GitHub OAuth callback",
          description: "Exchanges the code for a token, stores the session, and redirects to the web app. Called by GitHub, not by clients.",
          security: [],
          parameters: [
            { name: "code", in: "query", required: true, schema: { type: "string" }, description: "Authorisation code from GitHub." },
            { name: "state", in: "query", required: true, schema: { type: "string" }, description: "CSRF state issued at /auth/github/login." },
          ],
          responses: { "302": { description: "Redirect to the web app, signed in or with an error." } },
        },
      },

      "/auth/magiclink/login": {
        post: {
          operationId: "requestMagicLink",
          tags: ["Authentication"],
          summary: "Email a single-use sign-in link",
          description: "Sends a link that is good for one use and expires in 15 minutes. Rate limited to 3 requests per address per minute. A magic-link account can do everything except the GitHub integrations — cloning private repositories, pushing branches, and the repository picker.",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { email: { type: "string", format: "email" } },
                  required: ["email"],
                },
                examples: { basic: { value: { email: "you@example.com" } } },
              },
            },
          },
          responses: {
            "200": {
              description: "Link sent.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { message: { type: "string" }, success: { type: "boolean" } },
                    required: ["message", "success"],
                  },
                },
              },
            },
            "400": errorResponse("Missing or malformed email address."),
            "429": errorResponse("Rate limit: more than 3 requests for this address in a minute."),
            "500": errorResponse("The mail could not be generated or sent."),
          },
        },
      },

      "/auth/magiclink/verify": {
        get: {
          operationId: "verifyMagicLink",
          tags: ["Authentication"],
          summary: "Redeem a sign-in link",
          description: "Consumes the token, creates the session and redirects to the web app. Opened from the email; a token works once.",
          security: [],
          parameters: [
            { name: "token", in: "query", required: true, schema: { type: "string" }, description: "The token from the emailed link." },
          ],
          responses: { "302": { description: "Redirect to the web app, signed in or with an error." } },
        },
      },

      "/api/repl/": {
        get: {
          operationId: "listWorkspaces",
          tags: ["Workspaces"],
          summary: "Every workspace on the account",
          description: "Returns all workspaces owned by the signed-in account, running or not. Note the trailing slash: `/api/repl` answers 301 to `/api/repl/`.",
          security: SESSION_AUTH,
          responses: {
            "200": {
              description: "The account's workspaces. `null` rather than `[]` when there are none.",
              content: {
                "application/json": {
                  schema: { type: "array", items: { $ref: "#/components/schemas/Repl" }, nullable: true },
                },
              },
            },
            "401": errorResponse("No session."),
            "500": errorResponse("The workspace store could not be read."),
          },
        },
      },

      "/api/repl/new": {
        post: {
          operationId: "createWorkspace",
          tags: ["Workspaces"],
          summary: "Create a workspace",
          description: "Copies the template's files into object storage under the account's prefix and records the workspace. It does not start a pod — call `startWorkspace` for that. The free tier allows two workspaces; a third is refused with a 500 whose body reads `Free Account Limit Reached`.",
          security: SESSION_AUTH,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    userName: { type: "string", description: "Ignored — the owner is taken from the session. Present for historical reasons." },
                    template: { type: "string", enum: ["node", "python", "go"], description: "Which template seeds the filesystem." },
                    replName: { type: "string", description: "Name for the workspace, unique within the account." },
                  },
                  required: ["template", "replName"],
                },
                examples: { node: { value: { userName: "", template: "node", replName: "api" } } },
              },
            },
          },
          responses: {
            "200": {
              description: "Created. The body is the JSON string `\"Success\"`, not an object — call `listWorkspaces` for the new record.",
              content: { "application/json": { schema: { type: "string", const: "Success" } } },
            },
            "400": errorResponse("The request body was not valid JSON."),
            "401": errorResponse("No session."),
            "500": errorResponse("Free-tier limit reached, or the template copy failed."),
          },
        },
      },

      "/api/repl/session/{replId}": {
        parameters: [
          { name: "replId", in: "path", required: true, schema: { type: "string" }, description: "Workspace ID." },
        ],
        get: {
          operationId: "startWorkspace",
          tags: ["Workspaces"],
          summary: "Start a workspace and wait for it",
          description: "Schedules a Kubernetes Deployment, Service and Ingress for the workspace and blocks until the runner answers its own health check. This is the expensive call — it takes roughly 10–20 seconds on a warm node. Despite the GET it is not safe or idempotent; it creates cluster resources.",
          security: SESSION_AUTH,
          responses: {
            "200": {
              description: "Running.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { replId: { type: "string" }, replName: { type: "string" } },
                    required: ["replId", "replName"],
                  },
                },
              },
            },
            "400": errorResponse("No workspace with that ID."),
            "401": errorResponse("The workspace belongs to another account."),
            "500": errorResponse("Scheduling failed, or the runner never answered."),
          },
        },
        delete: {
          operationId: "stopWorkspace",
          tags: ["Workspaces"],
          summary: "Stop a workspace, keeping its files",
          description: "Deletes the Deployment and Service. The filesystem stays in object storage and is restored the next time the workspace starts.",
          security: SESSION_AUTH,
          responses: {
            "200": { description: "Stopped.", content: { "application/json": { schema: { type: "string", const: "Success" } } } },
            "400": errorResponse("No workspace with that ID."),
            "401": errorResponse("The workspace belongs to another account."),
            "500": errorResponse("The cluster resources could not be removed."),
          },
        },
      },

      "/api/repl/{replId}": {
        parameters: [
          { name: "replId", in: "path", required: true, schema: { type: "string" }, description: "Workspace ID." },
        ],
        delete: {
          operationId: "deleteWorkspace",
          tags: ["Workspaces"],
          summary: "Delete a workspace and its files",
          description: "Stops the workspace if it is running, then removes its object-storage prefix and its record. Irreversible — the filesystem is not recoverable afterwards.",
          security: SESSION_AUTH,
          responses: {
            "200": { description: "Deleted.", content: { "application/json": { schema: { type: "string", const: "Success" } } } },
            "400": errorResponse("No workspace with that ID."),
            "401": errorResponse("The workspace belongs to another account."),
            "500": errorResponse("Deleting the files or the record failed."),
          },
        },
      },

      "/api/runner/{replId}": {
        parameters: [
          { name: "replId", in: "path", required: true, schema: { type: "string" }, description: "Workspace ID." },
        ],
        delete: {
          operationId: "retireRunnerSession",
          tags: ["Runner"],
          summary: "A runner retiring its own session",
          description: "Called by a runner pod when it decides it is idle. Unauthenticated by design — the caller is inside the cluster — so it is documented for completeness rather than for use. Prefer `stopWorkspace`.",
          security: [],
          responses: {
            "200": { description: "Retired.", content: { "application/json": { schema: { type: "string", const: "Success" } } } },
            "400": errorResponse("No workspace with that ID."),
            "500": errorResponse("The cluster resources could not be removed."),
          },
        },
      },
    },
    components: {
      schemas: { User: USER_SCHEMA, Repl: REPL_SCHEMA, Error: ERROR_SCHEMA },
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "oauth-session",
          description: "Signed session cookie set by GitHub OAuth or a magic link. HttpOnly, SameSite=Lax, seven days. Set on the API origin, so a browser client must send credentials and be listed in the CORS allowlist.",
        },
      },
    },
    security: SESSION_AUTH,
  };
}
