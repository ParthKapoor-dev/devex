# DevEx redesign — working status

Living state for the `redesign` branch. Written so work can resume after a
context reset without re-deriving anything. Update it as decisions land.

**Last updated:** 2026-09-13
**Branch:** `redesign` · **Worktree:** `/home/parth/code/dev/golang/devex/.claude/worktrees/redesign`
**Branched from:** `56f44d2` on `main`

---

## 1. The brief

Full visual redesign of the frontend. The maintainer's words:

> "I want you to redesign the complete site... every page, change components,
> layouts, working... everything should be cool, nice and smooth. But the
> sandbox page should be extremely fast, should give developer feel."

Constraints and permissions:

- **Frontend only.** The backend must not change, *except* the magic-link email.
- Full licence to add/remove/replace components, layouts and backgrounds.
- The animated, high-contrast look is a product asset — a big reason the repo
  gets attention. Do not flatten it into a generic minimal template. The bar is
  "distinctive *and* cheap", not one or the other.
- The sandbox/IDE page has the strictest bar: extremely fast, developer feel.
- Docs must be properly redesigned (they were "okish, but not good").
- Keep making **granular git commits**, one per distinct change.

---

## 2. Decisions made (do not relitigate)

| Decision | Choice | Notes |
| --- | --- | --- |
| **Accent direction** | **B · Graphite + Signal** | Near-monochrome true-neutral surfaces (zero chroma) + one sharp **amber** accent used sparingly. Chosen over Signal Violet and over keeping emerald. |
| Docs stack | Custom MDX on our own design system | Chosen over Fumadocs (which the research recommended) so docs keep the product's visual identity. Cost accepted: we hand-build search/TOC/pager. |
| Production domain | `devx.parthkapoor.me` | Set via `NEXT_PUBLIC_SITE_URL`; found in the Resend sender address. |
| Footer card | **Reverted to original** | The maintainer explicitly said not to change it. Its glass look is now the `glass` utility in globals.css. |
| Bundler | **webpack, not Turbopack** | `@next/mdx` can't pass remark/rehype plugins across Turbopack's loader boundary on Next 15. See the comment atop `next.config.ts`. |
| Local dev URLs | portless | `scripts/dev-portless.sh`. |

### The chosen palette — Graphite + Signal

Currently lives in `apps/web/app/design/palettes.css` under
`[data-palette="graphite"]`. **Next step is to promote it into
`app/globals.css` as the real `--ds-*` values** and delete the lab.

```css
--ds-brand-500: oklch(0.769 0.188 70.08);   /* amber */
--ds-brand-fg:  oklch(0.18 0.02 60);
--ds-canvas:    oklch(0.135 0 0);            /* true neutral, zero chroma */
--ds-surface:   oklch(0.175 0 0);
--ds-raised:    oklch(0.215 0 0);
--ds-overlay:   oklch(0.195 0 0);
--ds-ink:       oklch(0.98 0 0);
--ds-ink-muted: oklch(0.7 0 0);
--ds-ink-subtle:oklch(0.52 0 0);
--ds-edge:      oklch(1 0 0 / 9%);
--ds-edge-strong: oklch(1 0 0 / 18%);
--ds-term-accent: oklch(0.78 0.19 152);      /* terminal green stays green */
```

Rules that come with this direction:
- The accent appears on **one thing per screen** — the primary action, the live
  state, the selected row. Target roughly 1–2% coverage.
- Surfaces are true neutral so nothing competes with it.
- **The backdrop is the colour event.** The shader does the expressive work; the
  chrome stays quiet.
- Amber over a cool accent: on greyscale, warm reads as *attention* rather than
  decoration, and stays legible at low coverage.

---

## 3. Open questions

1. **File tree library.** `trees.software` (`@pierre/trees`) was requested, but
   research found it has **no async/lazy children API at all** and renders Preact
   in a shadow DOM, so Tailwind can't reach rows. For a cloud IDE with
   lazy-loaded, potentially huge trees the recommendation is
   `@headless-tree/core` + `@headless-tree/react` + `@tanstack/react-virtual`
   (~29 KB gz, async is first-class). **Needs the maintainer's call before
   switching.**
2. Which display/sans typeface. Monospace is settled (see §5).
3. Whether the Waves canvas is retired entirely in favour of the WebGL
   backgrounds, or kept as a cheap fallback.

---

## 4. Commits so far

```
d5b6530 feat(web): add /design palette lab with two candidate directions
e188de8 revert(web): restore the original footer card, and promote its glass look
c7a2680 fix(web): restore dashed dividers and remove the duplicate main landmark
a5686da fix(web): stop unintended emerald on dashboard tabs and sandbox chrome
638ce29 fix(web): restore mono font on 15 call sites broken by the token rename
d312146 chore(dev): add portless script for named local dev URLs
5baefb1 perf(web): cap the Waves backing store at 1.5x DPR
f8b8db5 fix(core): rebuild magic-link email on email-safe, dark-mode-aware HTML
1baf695 feat(web): design system, canvas perf, MDX docs and SEO foundation
```

---

## 5. Research

All under `~/code/sandbox/void/ui/`. ~39,000 lines total. **Read the relevant
file before rebuilding anything it covers — several carry per-component
performance verdicts and known upstream bugs.**

### Round 1 — `ui/`
| File | Contents |
| --- | --- |
| `INDEX.md` | Overview of round 1 |
| `rareui.md` | RareUI; registry at `/r/<kebab-name>.json` |
| `skiper-ui.md` | skiper-ui registry, 106 components, 37 free |
| `opensourceui.md` | 207 components; **no animated backgrounds at all** |
| `starred-repos.md` | 612 starred repos → ~75 frontend-relevant |
| `docs-mdx-seo.md` | Fumadocs vs Nextra vs DIY; Next 15 SEO API reference |
| `email.md` | Email client matrix; the template we shipped |

### Round 2 — `ui/v2/`
| File | Contents |
| --- | --- |
| `reactbits.md` | 8,301 lines. 171 components. Full source: 16 backgrounds, 12 text animations |
| `rareui-deep.md` | HookSidebar / FluidOrb / GridReveal, deep |
| `trees-skiper-orbs.md` | File-tree library comparison; skiper26 + skiper67 source; thinking-orbs |
| `protected-route-regressions.md` | Verified regression audit (all fixed, see §6) |
| `typography.md` | **Monospace** faces — recommends **Commit Mono** |

### Still running at last checkpoint
Three agents were relaunched after hitting a session rate limit:
`design-references.md`, `registries.md`, `typography-display.md`.
**Check whether those files exist before assuming the research is missing.**

### Findings that must not be rediscovered the hard way

- **WebGL contexts are capped at ~8–16 per document.** Any WebGL background
  inside a `.map()` will black out. FluidOrb spawns one context per instance, so
  it fails as an avatar fallback in a list — it works as a single large
  centrepiece. For avatars, draw one deterministic frame seeded from the user id.
- **Plasma is the only production-grade React Bits background** — `renderScale`,
  `maxDpr`, `targetFps`, IntersectionObserver, visibilitychange, reduced-motion
  and context-loss recovery are all built in. Every other one needs hardening.
  Of 56 backgrounds, only 3 respect `prefers-reduced-motion`.
- **`ogl` ≈ 12 KB gz vs `three` ≈ 150 KB** for an identical fullscreen quad.
  Avoid every `three`-based component. Shaders port trivially between them.
- **`Aurora` allocates ~420 objects/sec** rebuilding its colour ramp inside the
  rAF callback. **`GridScan` imports `face-api.js`** (~700 KB). **`DotGrid`
  needs paid GSAP InertiaPlugin.** Nothing in React Bits is marked `'use client'`.
- **Canvas `strokeStyle`/`fillStyle` cannot resolve `var()`, `oklch()` or
  `currentColor`.** Plasma's `hexToRgb` only parses hex — passing a token
  silently renders the fallback colour. Resolve via `getComputedStyle` or pass
  hex literals.
- **`html/template` silently deletes HTML comments**, which removes the MSO
  conditional comments carrying the email's VML button. Use `text/template`.
- **Dark-authored email is the worst case** — Gmail iOS and Outlook Windows
  force a full colour invert. Author light, enhance to dark.

---

## 6. Regressions found and fixed

The globals.css rewrite broke the protected routes. All four are fixed, but the
*causes* are worth remembering:

- **`--color-primary` was commented out of the old theme**, so `bg-primary`
  resolved to nothing and shadcn's default Button was effectively transparent
  with inherited colour. Call sites were written against that accident. Defining
  `primary` switched every latent class on — the inactive dashboard tab became
  the same emerald as the active one.
- `tailwind-merge` drops `bg-primary` when a call site has its own `bg-*`, but
  **`text-primary-foreground` survives** (different merge group). That is how
  icons ended up black-on-black.
- A global `* { border-color }` in `@layer base` lands after preflight and flips
  every colourless border from `currentColor` to the token — it washed out every
  dashed divider in the sandbox.
- Renaming a font utility without migrating call sites fails **silently**.

**Three assumptions I held that the audit refuted** — do not "fix" these:
- The body background is byte-identical before and after (`#0a0a0a` both ways).
- `hsl(0,0%,100%,10%)` is valid CSS (Color 4 legacy alpha); those borders were
  never invisible.
- No dead `--app-*` / `--terminal-*` / `--hu-*` references survive anywhere.

---

## 7. Running it locally

Backend talks to **live production infrastructure** — the real Kubernetes
cluster and the real S3 bucket. Creating or starting a REPL from local schedules
real pods. Login/dashboard/listing are read-only and safe.

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

Named URLs via portless: `bash scripts/dev-portless.sh`
→ `https://devex.localhost`, `https://devex-api.localhost`.
Needs `portless proxy start` and `portless trust` run with sudo by the user,
otherwise it falls back to `:1355` with an untrusted certificate.

Health check: `curl -s localhost:8080/ping` should report `api/k8s/s3/redis` all `ok`.

Email preview:
`EMAIL_PREVIEW_DIR=/tmp go test ./internal/email/ -run TestWriteEmailPreview`

### Known backend papercuts (NOT fixed — out of scope)
`internal/redis/store.go` logs `Failed to connect to Redis` and then
unconditionally logs `Connected to Redis` on the next line, and
`opt, _ := redis.ParseURL(...)` discards the parse error so a malformed URL
nil-panics rather than reporting. Three-line fix when the backend is in scope.

---

## 8. What is done

- Design-token layer in `app/globals.css` (`@theme inline`, so `--ds-*`
  overrides re-cascade at runtime — this is what makes the palette lab work).
- Canvas perf primitives: `hooks/use-canvas-scene.ts`,
  `use-reduced-motion.ts`, `use-active-in-view.ts`. **Never write a bare
  `requestAnimationFrame` loop.**
- MDX docs at `content/docs/` (7 pages), driven by `lib/docs/source.ts`.
  Docs First Load JS went 448 kB → 115 kB.
- Full SEO surface: `lib/site.ts`, `lib/seo.ts`, sitemap, robots, manifest,
  build-time OG image, JSON-LD. None of it existed before.
- Magic-link email rebuilt on email-safe table HTML with tests.
- `/design` palette lab.
- React Bits `Plasma` and `LightRays` vendored into `components/backgrounds/`.

## 9. What is next

1. **Promote Graphite + Signal into `globals.css`**, delete `/design` and
   `palettes.css`.
2. **Sandbox/IDE page** — the strictest bar. Extremely fast, developer feel.
3. Dashboard, login, landing, docs — in that order of user-visible value.
4. Typography swap once the display-face research lands.
5. Update `apps/web/AGENTS.md` with whatever the redesign establishes.
