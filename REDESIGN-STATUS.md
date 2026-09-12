# DevEx redesign — status

State of the `redesign` branch. Written so work can resume without
re-deriving anything.

**Branch:** `redesign` · **Branched from:** `56f44d2` on `main`
**Worktree:** `/home/parth/code/dev/golang/devex/.claude/worktrees/redesign`

---

## 1. The brief

Full visual redesign of the frontend.

> "I want you to redesign the complete site... every page, change components,
> layouts, working... everything should be cool, nice and smooth. But the
> sandbox page should be extremely fast, should give developer feel."

Constraints:

- **Frontend only.** The backend must not change, *except* the magic-link email.
- The animated, high-contrast look is a product asset — a big reason the repo
  gets attention. Do not flatten it into a generic minimal template. The bar is
  "distinctive *and* cheap", not one or the other.
- The sandbox has the strictest bar: extremely fast, developer feel.
- **The footer card must not change.** Explicitly asked for.
- Granular commits, one per distinct change.
- Subagents on Sonnet for anything that is not hard.

---

## 2. Decisions (do not relitigate)

| Decision | Choice |
| --- | --- |
| Accent direction | **Graphite + Signal** — true-neutral zero-chroma surfaces, one amber accent at ~1–2% coverage |
| Display face | **Space Grotesk** (cap-height matches Commit Mono exactly) |
| Body face | **Geist** |
| Mono | **Commit Mono**, self-hosted from `@fontsource/commit-mono` (OFL-1.1) |
| Docs stack | Custom MDX on our own design system, not Fumadocs |
| Bundler | webpack, not Turbopack — `@next/mdx` can't pass plugins across Turbopack's loader boundary |
| Landing backdrop | Plasma (WebGL, masked to top 85vh) + static wash + grid + grain |
| Signed-in backdrop | `AppBackdrop` — static, zero JS |
| Production domain | `devx.parthkapoor.me` |

**The accent rule that everything follows:** amber means *this is the thing you
are on*. The primary action, the live state, the selected row, the cursor.
Not decoration, not status, not terminal output.

---

## 3. What shipped

The second pass on the marketing site and docs:

```
d2cde51 fix(web): align the header with the content under it
d0fea99 feat(web): put the docs on the same backdrop as everything else
d3236ba feat(web): ask once more at the bottom of the page
dfdf2a0 feat(web): make the hero shot look like the product
ddb7a30 fix(web): stop telling Linux users to press ⌘
5cc4f1b fix(web): the header was never migrated onto the tokens
44965c4 fix(web): the docs were amber everywhere
d4d0c64 feat(web): give /docs an actual front door
4049a10 feat(web): stop opening the page with third-party badges
4fee30e feat(web): explain how a workspace actually starts
5bbb053 feat(web): rebuild pricing as a spec sheet
f80b9d6 feat(web): give the landing page one section frame
```

The first pass:

```
d5b0fa5 fix(web): editor came up in the wrong theme, and every file click toasted
2c1bce8 docs: record the redesign in AGENTS.md and the status file
e6886c7 perf(web): stop the sandbox re-rendering Monaco and xterm on every interaction
d9ac723 feat(web): redesign the docs
b467eaf feat(web): redesign the landing page
8e54fc5 feat(web): redesign the login flow
7604f54 feat(web): redesign the dashboard
af95f66 feat(web): redesign the sandbox IDE on the design system
3be96ee fix(web): sandbox correctness and dependency hygiene
be787c4 feat(web): new type stack, and make font-display mean a display face
bde79cc feat(web): rebuild the landing backdrop around the shader
8cd8459 feat(web): adopt Graphite + Signal as the palette
```

Earlier, pre-checkpoint: `61e8d12` `d5b6530` `e188de8` `c7a2680` `a5686da`
`638ce29` `d312146` `5baefb1` `f8b8db5` `1baf695`.

### Measured

| | Before | After |
| --- | --- | --- |
| Landing First Load JS | 194 kB | **185 kB** (with two more sections) |
| Docs First Load JS | 448 kB | **115 kB** |
| Fonts shipped | 90.8 kB / 3 families | **85.2 kB / 3 families** |
| Waves point-updates/sec | 1.21M | 138K |
| Waves backing store | 29.3 MB | 17.8 MB |

`/repl` is unchanged at 261 kB. The sandbox work was about render cost, not
bundle size.

---

## 4. Bugs found and fixed along the way

Worth remembering because the *causes* recur:

- **`LetterGlitch` ran an unbounded full-screen rAF** behind the dashboard —
  no reduced-motion, no pause on tab-hide, no intersection check.
- **The dashboard clock never ticked** and guaranteed a hydration mismatch:
  `new Date().toLocaleTimeString()` called straight in render.
- **The GUI panel nested a second app header** inside the dashboard's own
  fixed-height panel, so the product name appeared twice and content overflowed.
- **Bottom panel tabs and the whole port-forwarding panel were light-themed**
  (`bg-white`, `bg-gray-100`, `border-blue-500`) inside a dark IDE.
- **The collapsed magic-link form was still focusable** — hidden with
  `max-h-0 overflow-hidden`, which keeps inputs in the tab order.
- **The login square-grid background was drawn in `black`** on a near-black
  canvas, so it had been rendering nothing.
- **The terminal only worked by accident.** It imported the deprecated unscoped
  `xterm`, present only as a transitive dep of deprecated addons. Any dedupe
  would have broken it at runtime with no build error.
- **The terminal requested four fonts the app doesn't load**, falling through to
  the platform monospace.
- **The docs copy button did not exist on touch** — `opacity-0` until
  `group-hover`.
- **`LogoCloud` was fabricated social proof** — "Trusted by experts" over five
  other companies' logos. Dead code, now deleted.
- **Typing `?` anywhere** (Monaco, rename box, terminal) opened the shortcuts
  modal — no input guard on a bare-key global shortcut.
- **The editor diffed the whole file on every keystroke** — `diff_match_patch`
  is O(n·m), so typing cost scaled with file length.
- **Three pieces of state were written and never read**: `isLoading`,
  `isTablet`, `terminalSearchTerm`.
- **`useSocket` returned fresh function identities every render**, making every
  downstream `useCallback` decorative.
- **A `docs-prose` class with no rule defined anywhere** made the docs look
  centrally styled when the measure was simply never set.

Found in the second pass, all in the header and the marketing page:

- **`bg-ink` used as a background in five places** in the vendored navbar.
  `ink` is the *text* colour, so the primary call to action on every page was
  a near-white pill rather than the brand.
- **Nav items were bare `<a href>`** — every click on "Docs" threw away the
  client and did a full document load.
- **`hover:text-zinc-800` on the nav row**: dark grey text, on hover, on a
  near-black background.
- **The shrink-on-scroll animated `width` to 40% under `minWidth: 800px`**, so
  below a 2000px viewport the clamp won and the pill barely moved. The bar also
  rested at 1152px with `px-32`, aligning with nothing on the page.
- **`router.push()` with an external URL** for "Book a call" — no new tab, no
  `rel`, and the address hardcoded beside the one already in `siteConfig`.
- **Every shortcut hint said `⌘K`** while the handlers all accept
  `metaKey || ctrlKey`, so Linux and Windows were told to press a key they do
  not have.
- **Inline code in the docs was `text-brand-300`** — dozens of amber fragments
  per screen, which left links indistinguishable from ordinary nouns.
- **Pricing was still pre-redesign**: 22 amber icon bubbles, an amber glow, an
  amber savings pill and an amber gradient wash, plus a `resize` listener
  firing a setState per pixel of a window drag to offset one card by 12px.
- **"Where to go next" in `index.mdx`** hand-listed four of seven docs pages.

### Three assumptions the audit REFUTED — do not "fix" these

- The body background is byte-identical before and after.
- `hsl(0,0%,100%,10%)` is valid CSS (Color 4 legacy alpha) — those borders were
  never invisible.
- No dead `--app-*` / `--terminal-*` / `--hu-*` references survive anywhere.

---

## 5. Requested components — what happened to each

| Requested | Outcome |
| --- | --- |
| watermelon `auth-09` | **Rejected.** Registry 404s repo-wide; the block is a *sign-up* page with no tokens, no dark variant, blue accent. Login built directly instead. |
| `trees.software` (`@pierre/trees`) | **Not adopted.** No async/lazy children API at all, and renders Preact in a shadow DOM so Tailwind can't reach rows. Existing tree kept and restyled. |
| rareui FluidOrb | **Not adopted.** One WebGL context per instance; browsers cap at ~8–16 per document, so it cannot be used in a list. |
| rareui HookSidebar / GridReveal | Not adopted — the sandbox and docs sidebars are purpose-built and denser. |
| skiper26 / skiper67 | Not adopted; the app is dark-only so a theme toggle has nothing to toggle. |
| reactbits | **Plasma adopted** as the landing backdrop — the only production-grade background in the set (renderScale, maxDpr, targetFps, IO, visibilitychange, context-loss recovery all built in). |
| libraries.dev/orbs | Not adopted. |

---

## 6. Open / not done

1. **Nothing has been seen rendered in a browser.** The Chrome extension is
   still not connected to this session, so every visual claim is inferred from
   the served CSS and HTML, not observed. `/repl/[slug]` in particular needs
   eyes — it requires a login.
2. **`isTerminalMaximized` is set but the maximise behaviour is not wired** in
   the desktop layout (pre-existing).
3. Two backend papercuts, out of scope: `internal/redis/store.go` logs
   "Failed to connect" then unconditionally logs "Connected" on the next line,
   and `redis.ParseURL`'s error is discarded so a malformed URL nil-panics.
4. `components/navbar-components/user-menu.tsx` still carries a placeholder
   Origin UI demo email string. Harmless, but it should be scrubbed. (No AGPL
   dependency exists — checked.)

---

## 7. Running it locally

The backend talks to **live production infrastructure** — the real Kubernetes
cluster and the real S3 bucket. Creating or starting a REPL schedules real pods.
Login, dashboard and listing are read-only and safe.

```bash
# Redis — the Upstash instance is GONE (free tier reaped for inactivity;
# direct-vervet-33473.upstash.io does not resolve). Use a local one.
redis-server --port 6379 --save '' --appendonly no

# Core API on :8080 — must run from apps/core so godotenv/autoload finds .env.
# Port is fixed: the GitHub OAuth callback is registered against localhost:8080.
cd apps/core && go build -o /tmp/devex-core ./cmd/main.go
REDIS_URL="redis://localhost:6379/0" /tmp/devex-core

# Frontend on :3000 — port is fixed to match FRONTEND_URL and the CORS allowlist.
cd apps/web && npm run dev
```

Named URLs via portless: `bash scripts/dev-portless.sh`, then
`https://devex.localhost:1355` and `https://devex-api.localhost:1355`.
**The port is required** — the proxy listens on 1355. The cert is untrusted
until the user runs `portless trust` with sudo.

Health check: `curl -s localhost:8080/ping` → `api/k8s/s3/redis` all `ok`.

Email preview:
`EMAIL_PREVIEW_DIR=/tmp go test ./internal/email/ -run TestWriteEmailPreview`

**Do not run `npm run build` while `npm run dev` is running.** They share
`.next`, and the production build overwrites artifacts the dev server has open —
it fails with a `MODULE_NOT_FOUND` in `_document.js` that looks like a missing
dependency but is not. Stop dev, build, then restart dev.

---

## 8. Where the guidance lives

`apps/web/AGENTS.md` is the durable version of everything above — token rules,
accent rationing, the type stack, motion tiers, canvas rules, React render
rules, IDE conventions, docs authoring, SEO, and the licence landmines found in
the registry survey. Read it before touching the frontend.

Research: `~/code/sandbox/void/ui/` and `~/code/sandbox/void/ui/v2/`.
