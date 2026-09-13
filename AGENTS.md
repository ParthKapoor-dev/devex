# Devex Agent Guide

**Summary**
Devex is a cloud development IDE with sandboxed “repl” sessions. The system is split into services. The core service handles auth and session orchestration, while the runner provides the interactive sandbox (WebSocket + PTY). Session data is persisted to S3-compatible storage when a repl is deactivated.

**Architecture (High Level)**
- Core service (`apps/core`) is deployed to a VPS via Docker Swarm and is the control plane.
- Runner service (`apps/runner`) is the data plane sandbox image. Each repl is a Kubernetes Deployment with a single pod.
- Pod layout:
  - `initContainer` pulls workspace files from S3.
  - `runnerContainer` is the interactive sandbox (WebSocket + PTY).
- Deactivation flow:
  - Core injects an ephemeral container into the pod to upload workspace data to S3.
  - Core then deletes Deployment/Service/Ingress/Middleware.
- Routing:
  - Base host: `repl.parthkapoor.me`
  - Route pattern: `repl.parthkapoor.me/<repl-id>/<route>`
  - Uses `hostNetwork: true` to avoid a load balancer and save cost.

**Key Entry Points**
- Core API: `apps/core/cmd/main.go`
- Runner API: `apps/runner/cmd/main.go`
- MCP service: `apps/mcp/cmd/main.go`

**Repo Layout**
- `apps/core/`: Control-plane service (auth + session orchestration + k8s + s3 + redis).
- `apps/runner/`: Sandbox service (WebSocket, PTY, file operations, shutdown manager).
- `apps/mcp/`: MCP server.
- `apps/web/`: Frontend web app.
- `apps/agent/`: Agent-related app (check README inside).
- `packages/`: Shared Go packages and generated protobufs.
  - `packages/logging`: Shared logger wrapper.
  - `packages/proto` + `packages/pb`: Proto sources and generated code.
- `infra/`: Deployment and infrastructure.
  - `infra/core/`: Swarm dockerfile + stack config.
  - `infra/runner/`: Runner dockerfiles (base + language variants).
  - `infra/mcp/`: MCP dockerfile.
  - `infra/k8s/`: K8s manifests, cert-manager, ingress, traefik.
- `templates/`: Repl templates synced to object storage.

**Data Stores**
- Redis: repl/session state.
- S3-compatible storage: workspace persistence on session end.

**Build and Test (Local)**
- Core build:
  - `cd apps/core`
  - `go build -o /tmp/core ./cmd/main.go`
- Runner build:
  - `cd apps/runner`
  - `go build -o /tmp/runner ./cmd/main.go`
- Docker images:
  - `docker build -f infra/core/dockerfile -t devex/core:local .`
  - `docker build -f infra/runner/dockerfile -t devex/runner:local .`

**CI/CD**
- Workflows live in `.github/workflows/`.
- Core pipeline builds/pushes and deploys via Docker Swarm.
- Runner pipeline builds runner + env images.
- Templates pipeline syncs `templates/` to DigitalOcean Spaces.

**Where to Look First**
- Auth/session logic: `apps/core/services/auth/`
- Repl lifecycle: `apps/core/services/repl/` and `apps/core/internal/k8s/`
- Runner WS/PTY: `apps/runner/pkg/ws/`, `apps/runner/pkg/pty/`
- Shared logging: `packages/logging/`

**Notes for Agents**
- The system relies on `hostNetwork: true` for simplicity and cost.
- The core service is the orchestrator; runner instances are ephemeral and created per repl session.
- If you change protobufs in `packages/proto/`, regenerate via `make generate-proto`.

---

## Frontend

**Working on `apps/web`? Read [`apps/web/AGENTS.md`](./apps/web/AGENTS.md) first.**
It covers the design-token system (raw Tailwind palette shades are banned in
component code), the animation/performance rules, MDX documentation authoring,
and SEO. The frontend's distinctive animated look is a product asset — the brief
is to keep it striking while keeping it cheap, not to simplify it away.

The visual direction is **Graphite + Signal**: true-neutral surfaces at zero
chroma with a single amber accent, rationed to roughly 1-2% of the pixels on
screen. The accent means one thing — *this is the thing you are on*. Colour that
is not the accent belongs in the backdrop, not the chrome.

Things that bite immediately:

- `apps/web` builds on **webpack, not Turbopack** (`npm run dev` omits the
  flag). MDX plugins cannot cross Turbopack's loader boundary on Next 15.
- **Do not run `npm run build` while `npm run dev` is running.** They share
  `.next`; the build overwrites artifacts the dev server has open and it fails
  with a `MODULE_NOT_FOUND` in `_document.js` that looks like a missing
  dependency but is not.
- Docs are authored MDX in `apps/web/content/docs/`, not scraped READMEs. The
  old GitHub-scraping pipeline is deleted; do not reintroduce it.
- Canvas, WebGL, Satori and the manifest cannot resolve `var()` or `oklch()`.
  Import hex from `apps/web/lib/tokens.ts`.
- The editor (Monaco) and the docs (Shiki) share one syntax palette. Change
  `components/sandbox/Editor/theme.ts` and `lib/docs/shiki-theme.ts` together.
- **Do not change the `glass` utility.** The maintainer asked to keep that
  treatment as-is. (The footer itself was redesigned on 2026-09-13, at the
  maintainer's request, along with everything after the FAQ.)
- **The landing page runs exactly one WebGL context** — the hero's CRT — and it
  pauses when the hero leaves the viewport. Do not add a second shader below
  the fold; use CSS or scroll-linked transforms.
- **`components/brand/block-wordmark.tsx` is unused on purpose.** The
  maintainer asked to keep it for later; do not delete it as dead code.
- **Run `npm run audit:agents` before calling a frontend change done.** It
  scores how readable the site is to an AI agent (`npx ax audit
  devx.parthkapoor.me`). Production was 30/100 when first measured. The audit
  reads the deployed origin, not your working tree, so the number only moves
  after a deploy. Every agent-facing document — robots.txt, llms.txt, the
  markdown twins, the OpenAPI spec, the `/.well-known` catalogues — is
  generated from `apps/web/lib/agents.ts`; change a fact there, not in the
  documents. `apps/web/AGENTS.md` has the full table and the list of checks
  that need backend work instead.

## Transactional email (`apps/core/internal/email`)

The magic-link email is a table-based HTML template in
`internal/email/templates/`, rendered by `render.go`.

- **It is parsed with `text/template`, NOT `html/template`.** `html/template`
  strips every HTML comment, which silently deletes the MSO conditional comments
  carrying the bulletproof VML button and the Outlook ghost tables. There is no
  error — the button just breaks in Outlook. `render_test.go` guards this; if it
  starts failing, someone switched the package.
- Escaping is therefore ours. Every field on `magicLinkData` is escaped at
  construction in `newMagicLinkData`. Anything added must be too.
- **The template is authored dark**, and declares `<meta name="color-scheme"
  content="dark">` — not `light dark` — so Apple Mail and iOS leave it alone
  instead of inverting it. Clients that force an invert anyway (Outlook mobile,
  OWA) are handled by re-asserting every colour under `[data-ogsc]` and
  `[data-ogsb]`. `render_test.go` asserts the palette is the current one, so a
  stale brand colour fails the build rather than shipping.
- Banned in email HTML: `backdrop-filter`, `linear-gradient`, `display:flex`,
  `position:absolute`, web fonts. Tests assert their absence. Use nested tables
  and solid `bgcolor` cells — the accent bar is four adjacent coloured cells,
  not a gradient.
- Always send the `text/plain` alternative; HTML-only mail is a spam signal.
- Preview it:
  `EMAIL_PREVIEW_DIR=/tmp go test ./internal/email/ -run TestWriteEmailPreview`
