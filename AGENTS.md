# DevEx — guide for AI agents

DevEx is an open-source cloud IDE: every workspace is a Linux container on
Kubernetes with an editor, a real terminal and a public preview URL. This is a
solo maintainer's project (Parth Kapoor), and **the maintainer is using the
backend and infrastructure to learn**. Read "How we work" before touching
anything.

## How we work

### Who does what

| Area | Paths | Agent's role |
|---|---|---|
| **Frontend** | `apps/web/**` | **Build it.** Implement, test and commit frontend changes. Read [`apps/web/AGENTS.md`](./apps/web/AGENTS.md) first. |
| **Backend** | `apps/core`, `apps/runner`, `apps/mcp`, `packages` | **Advise, don't change.** Investigate, file issues or advisories, review the maintainer's pull requests, explain concepts. |
| **Infrastructure & delivery** | `infra/**`, `templates/**`, `.github/workflows/**`, `makefile`, `go.work` | Same as backend. |
| **Repository docs** | `AGENTS.md`, `CONTRIBUTING.md`, `.github/*.md` | Edit when the process changes. |

The maintainer fixes backend and infra issues **themselves** so they learn by
doing. Don't write backend or infra code unless the maintainer explicitly asks
for it in the current request (e.g. "just do this one"); a request to *review*
or *help* means explain and point, not commit. When asked for help, prefer
guiding questions, pointers to the exact lines, and a sketch over a finished
patch. Always explain the *why* and name the concept (with a link to official
docs) so it can be looked up later.

### Branches

| Branch | Purpose | Rules |
|---|---|---|
| `main` | Production. Vercel deploys the web app from it; pushes that touch `apps/core`, `apps/runner`, `apps/mcp` or `infra/runner` build images and deploy the API. | Never push or merge to `main` unless the maintainer says so in that request. A maintainer-requested **hotfix** may go straight to `main`; afterwards merge `main` back into `develop`. |
| `develop` | Integration branch, always the latest. Checked out as a worktree at `~/code/dev/golang/devex-develop`. | Agents commit and push frontend work here. |
| `fix/…`, `feat/…` | One branch per issue, opened as a PR into `develop`. | The maintainer's backend branches. |
| `legacy-v1` | Archive of the pre-redesign app. | Don't touch. |

Pushing `develop` must not deploy anything. The one exception to watch:
`templates-pipeline.yaml` syncs `templates/**` to the production bucket from
**any** branch (issue #20) — don't push template changes until that is fixed.

### Finding problems: issues vs private advisories

The repository is **public** and the service is **live**.

- **Exploitable security holes** (auth bypass, secret exposure, isolation
  breaks — anything a stranger could use against current users) go to a
  **private draft security advisory**, never a public issue:
  `gh api -X POST repos/ParthKapoor-dev/devex/security-advisories` or
  *Security → Advisories → New draft*. Don't mention exploit details in
  commits, public issues or PR titles either.
- **Everything else** is a GitHub issue. Structure every issue the same way:
  *What's wrong* (with permalinks to exact lines at a fixed commit SHA,
  `blob/<sha>/path#L10-L20`), *Impact*, *Suggested fix*, *How to verify*,
  *Background reading* (official docs). Verify claims before filing: run the
  code, the test or the command, and say what was verified.
- Labels in use: `bug`, `reliability`, `security-hardening`, `dependencies`,
  `core`, `runner`, `k8s`, `auth`, `infra`, `build`, `ci`, `frontend`,
  `github-settings`, `tech-debt`, `documentation`, `fixed-on-develop`.
- The pinned **roadmap issue (#33)** orders the work. Add new issues to it.

### Reviewing the maintainer's pull requests

When asked to review PR #N:

1. `gh pr view N` and `gh pr diff N`; read the linked issue or advisory first
   so you judge the change against what it set out to fix.
2. Check out and run it: `gh pr checkout N && make ci`. Look at the CI run on
   the PR (`gh pr checks N`).
3. Review for: does it fix the root cause (not just the symptom); new bugs,
   races, error paths that don't `return`; security (secrets, auth checks,
   input validation); tests that would fail without the fix; behaviour or
   config changes that need a deploy step (new env var, Docker secret,
   `kubectl apply`); scope creep; commit messages.
4. Post the review on GitHub with `gh pr review N --comment -b "…"` (or
   `--request-changes` / `--approve`), with line-level suggestions where they
   help. Mark each point as *must fix*, *should fix* or *nit*.
5. Teach: for every *must fix*, explain why and link the concept.

Never merge a maintainer's PR unless asked.

### Commits

- Granular, one logical change each; conventional prefixes (`fix(core):`,
  `feat(web):`, `test(runner):`, `ci:`, `docs:`).
- The message body says what changed, why, and why behaviour is (or isn't)
  unchanged.
- End with the attribution trailer your harness provides.

## Safety rules (always)

- **Never read or print `apps/*/.env`** or any secret file. They hold
  production credentials.
- **The local backend talks to live production infrastructure** (real
  Kubernetes, bucket, Redis, Resend). Never create or start workspaces, send
  magic-link emails, or run mutating `kubectl`/`docker stack` commands.
- Tests must be offline (fakes, `httptest`, `miniredis`, client-go fakes,
  temp dirs).
- Don't run `npm run build` while `npm run dev` is running (see Frontend).

## Architecture

```
Browser ──► apps/web (Next.js, Vercel)
   │
   ├─ REST + session cookie ──► Traefik ─► apps/core  (Go, Docker Swarm on a VPS)
   │                                        ├─ Redis: repl:{id} hash, user:{name} set
   │                                        ├─ S3-compatible bucket: templates/{key}/, repl/{user}/{id}/
   │                                        ├─ GitHub OAuth, Resend (magic-link email)
   │                                        └─ Kubernetes API: per-workspace Deployment,
   │                                           Service, Traefik Middleware, Ingress
   │
   └─ WebSocket + preview ──► Traefik (hostNetwork) ─► workspace pod
                                                        ├─ init: download files from the bucket
                                                        ├─ runner  :8081 HTTP/WS, :50051 gRPC
                                                        └─ mcp     :8080 (optional sidecar)
```

- Routing: `https://repl.parthkapoor.me/{replId}/…` → that pod; the
  Middleware strips `/{replId}`. Preview: `/{replId}/user-app/{port}/…`.
- Stopping: the runner's 4-minute idle timer calls
  `DELETE /api/runner/{id}` on core; core injects an ephemeral uploader
  container to copy `/workspaces` back to the bucket, then deletes the four
  objects.
- An explainer with diagrams (ERD, sequence diagrams, image sizes) was written
  on 2026-09-13; issues #9–#33 and the private advisories describe the known
  problems.

### Repository layout

| Path | What |
|---|---|
| `apps/core` | Control-plane API. Entry `cmd/main.go`; routes `cmd/api/api.go`; auth `services/auth`; workspaces `services/repl`; runner callback `services/runner`; Kubernetes `internal/k8s`; stores `internal/redis`, `internal/s3`; sessions `internal/session`; email `internal/email`. |
| `apps/runner` | In-pod service: WebSocket events `services/repl` + `pkg/ws`, files `pkg/fs`, terminals `pkg/pty`, idle shutdown `pkg/shutdown`, preview proxy `cmd/proxy`, gRPC `services/mcp`. |
| `apps/mcp` | MCP server calling runner over gRPC. |
| `apps/web` | Frontend. |
| `packages` | Shared Go module: `logging`, `utils/json`, `proto` (source). `packages/pb` is **generated and git-ignored** — run `make proto`. |
| `infra/core` | Core Dockerfile, Swarm stack, deployment notes. |
| `infra/runner` | `dockerfile` (runner binary) and `<runtime>.dockerfile` language images. |
| `infra/mcp` | MCP Dockerfile. |
| `infra/k8s` | Traefik values, cert-manager issuers, smoke test, setup guide. |
| `templates/<key>` | Starter files copied into new workspaces. |

A stack needs four things to agree: `templates/<key>/`,
`infra/runner/<key>.dockerfile`, `apps/core/models/templates.go` and
`apps/web/lib/templates.tsx` (issue #19). The cluster is small and paid for
personally: keep images and per-workspace resources minimal.

## Build and test

Go is four modules tied together by `go.work`. The makefile runs every Go
target per module with `GOWORK=off`, which is how Docker and CI see them.

```sh
make help         # list targets
make proto-tools  # pinned protoc-gen-go / protoc-gen-go-grpc (protoc from your OS)
make proto        # generate packages/pb (needed once after cloning)
make build vet test test-race tidy-check
make web-check    # lint + typecheck + vitest for apps/web
make ci           # everything CI runs
```

- Go tests: stdlib `testing`, offline. PTY tests skip under `-race` until the
  race in `pkg/pty` is fixed (#23); CI runs tests with and without `-race`.
- Web tests: Vitest in `apps/web/tests/` (`npm run test`).

## CI/CD

| Workflow | Trigger | Does |
|---|---|---|
| `ci.yaml` | PRs; pushes to `develop`, `main` | Go tidy/build/vet/test, web lint/typecheck/test/build, build all images (no push), check language images carry the same-commit runner, image size table. Never deploys. |
| `core-pipleline.yaml` (sic, #30) | push to `main` touching `apps/core/**` | Build + push `core-service`, deploy the Swarm stack over SSH. |
| `runner-pipeline.yaml` | push to `main` touching `apps/runner/**`, `infra/runner/**` | Build + push `runner-service:<sha>`, then each language image with `RUNNER_IMAGE_TAG=<sha>`. |
| `mcp-pipeline.yaml` | push to `main` touching `apps/mcp/**` | Build + push `mcp`. |
| `templates-pipeline.yaml` | push to **any branch** touching `templates/**` (#20) | Sync templates to the bucket. |
| `cluster-availability-check.yaml` | every 12 h | Probe `repl.parthkapoor.me` DNS/TLS/routing. |

## Sharp edges

- `apps/web/lib/docs/source.ts` contains a literal NUL byte, so git and grep
  treat it as binary.
- Runner and mcp don't compile until `make proto` has generated `packages/pb`.
- Core reads configuration in package-level `var` initialisers; tests that
  need env must set it before the package loads.

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

Reference for reviewing backend PRs that touch the magic-link email.

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
