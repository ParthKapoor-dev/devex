# Frontend Agent Guide (`apps/web`)

Next.js 15 (App Router) · React 19 · Tailwind v4 · `motion` v12.

The animated, high-contrast look is a deliberate product asset — a large part of
why this project gets attention. **Do not flatten it into a generic minimal
template.** The standing brief is: keep it distinctive, make it cheap. Every
rule below exists so those two can coexist.

## Build constraints

**This app builds on webpack, not Turbopack.** `npm run dev` intentionally omits
`--turbopack`. On the Next 15 line `@next/mdx` hands plugin functions to
`@mdx-js/loader`, and Turbopack serialises loader options across a process
boundary — the function arrives as `null` and MDX compilation dies with *"Cannot
use 'in' operator to search for 'plugins' in null"*. The string plugin form
Turbopack accepts is not resolved by this loader version, and
`experimental.mdxRs` cannot take arbitrary remark/rehype plugins. See the
comment at the top of `next.config.ts`. Revisit on Next 16.

Before proposing a Next 16 upgrade: `fumadocs-ui@16` and several other packages
hard-pin `next@16` / `react@^19.2`. It is a coordinated bump, not a one-liner.

## Design tokens — the one hard rule

`app/globals.css` is the single source of truth for colour, radius, motion and
elevation. **Use semantic tokens. Never reach for a raw Tailwind palette shade
in component code.**

```tsx
// Wrong — this is how the codebase ended up with five neutral ramps
<div className="bg-zinc-900 border-neutral-800 text-gray-400">
<span className="text-emerald-400">

// Right
<div className="bg-surface border-edge text-ink-muted">
<span className="text-brand">
```

| Purpose | Token |
| --- | --- |
| Page background | `bg-canvas` |
| Card / panel | `bg-surface` |
| Hover / inset | `bg-raised` |
| Popover, dialog | `bg-overlay` |
| Primary text | `text-ink` |
| Secondary text | `text-ink-muted` |
| Tertiary text | `text-ink-subtle` |
| Hairline | `border-edge` |
| Stronger line | `border-edge-strong` |
| Brand accent | `text-brand`, `bg-brand`, ramp `brand-50`…`brand-950` |
| On the accent | `text-brand-fg` |
| Status | `success`, `warning`, `danger`, `info` |
| Terminal chrome | `term-bg`, `term-chrome`, `term-edge`, `term-ink`, `term-muted`, `term-accent` |

### Graphite + Signal: the accent is rationed

The palette is near-monochrome — surfaces are true neutral at **zero chroma** —
with a single **amber** accent. That only works if the accent stays scarce.

**Amber means one thing: *this is the thing you are on*.** The primary action,
the live state, the selected row, the cursor. Aim for roughly **1–2% of the
pixels on screen**. If you are reaching for `text-brand` a third time on one
screen, the answer is `text-ink` or `text-ink-muted`.

Things that are explicitly *not* the accent's job:

- **Decoration.** No amber borders on every card, no amber icon on every list
  item, no gradient-filled headings.
- **Status.** `success`, `warning`, `danger`, `info` exist for that. Note
  `warning` sits at a yellower hue than the brand on purpose — amber-on-amber
  would make "provisioning" indistinguishable from "primary action".
- **Terminal output.** The 16 ANSI colours and `term-accent` follow shell
  convention. Green means passed, red means failed. Do not rebrand them.

Colour that is *not* the accent belongs in the backdrop. `SiteBackdrop` and
`AppBackdrop` carry the expressiveness so the chrome can stay quiet.

Two naming traps:

- **`brand` is the amber accent. `accent` is not.** `accent` keeps its shadcn
  meaning — a subtle raised background for menu and dropdown hover — because a
  lot of vendored Radix code depends on it. Mapping `accent` to the brand colour
  turns every dropdown row bright amber.
- Prefer the existing utilities over re-deriving an effect inline: `glass`,
  `glow-brand`, `surface-card`, and `label` for the uppercase-mono UI voice.
  **Do not change `glass`** — it is the footer card's original treatment, which
  the maintainer asked to keep as-is.

### Colour outside CSS

Canvas 2D, WebGL shaders, Satori (`next/og`) and the web manifest all parse
colour by hand and **cannot resolve `var()` or `oklch()`**. Passing a token to
`strokeStyle` silently paints black; passing one to a shader silently paints
its fallback. Import the hex mirrors from **`lib/tokens.ts`** instead, and if
you change a `--ds-*` value in globals.css, regenerate the matching entry
there — nothing enforces it at build time.

## Typography

Three families, declared in `app/fonts.ts`. Do not add a fourth.

| Role | Face | Utility |
| --- | --- | --- |
| Display — headlines, eyebrows | Space Grotesk | `font-display` |
| Body and UI | Geist | `font-sans` (default) |
| Code, terminal, paths, identifiers | Commit Mono | `font-mono` |

- **`font-display` means a display face, not a second mono.** It used to point
  at JetBrains Mono, and fifteen `<kbd>` and terminal call sites were relying on
  that. They now use `font-mono`, which is what they meant.
- Space Grotesk is display-only: x-height 0.486em, so it thins out below ~20px,
  and it has **no italic** — `font-style: italic` synthesises a slant.
- Weight on display type should not exceed 500. Bold display reads as dated.
- next/font exposes these as `--font-*-face`, deliberately *not*
  `--font-sans`/`--font-mono`. Those are Tailwind theme keys; if next/font wrote
  them too, `--font-sans: var(--font-sans)` would resolve to itself and every
  stack would collapse to the browser default.
- The mono family name is hashed by next/font, so anything outside CSS that
  needs it (Monaco, xterm) must read `mono.style.fontFamily` from
  `app/fonts.ts`. A literal `"Commit Mono"` will not resolve.

**The UI voice is the `label` utility** — uppercase mono at 0.08em tracking.
Use it for eyebrows, column headers, status chips and section labels. It does
more for the product's identity than colour does, and the mono is already
loaded for code, so it is free.

## Motion

Tokens: `--duration-fast|normal|slow|slower` and the easings `--ease-out-quad`,
`--ease-out-expo`, `--ease-out-circ`, `--ease-spring`. Write
`duration-[--duration-fast]`, not a hardcoded `duration-200`, so retiming the
app stays a one-line edit.

Two tiers, and the distinction matters:

- **`fast` (80ms)** — the response to a pointer: hover, press, focus. Short
  enough to read as instant rather than as an animation.
- **`normal` (150ms)** — something entering or leaving.

`--ease-out-circ` is the workhorse for a click response: fast travel, hard
settle.

There is **no `tailwind.config.ts`** and there must not be one. Tailwind v4
reads `@theme` in `globals.css`. A JS config that is not wired in with `@config`
is silently dead — the repo previously carried a 310-line one whose utilities
generated nothing at all.

## Animation and performance

The landing page runs a full-screen canvas field. That is fine, provided it
obeys these rules.

**Never write a bare `requestAnimationFrame` loop.** An ungated loop keeps
running while its element is scrolled out of view and while the tab is in the
background, burning CPU and battery for pixels nobody sees.

- **Canvas animation → `hooks/use-canvas-scene.ts`.** Handles sizing, device
  pixel ratio, an FPS cap, and pausing via `IntersectionObserver` +
  `visibilitychange`. Scenes draw in CSS pixels; the DPR transform is applied
  for you. Implement `still()` for the reduced-motion frame.
- **A non-canvas loop you cannot port → gate it with `hooks/use-active-in-view.ts`.**
- **Always honour `hooks/use-reduced-motion.ts`.** Reduced motion means a static
  frame, not a slower animation.

Rules learned the hard way in this codebase:

- **Size backdrops to the viewport, not the page.** A `position: absolute;
  height: 100%` canvas inside a full-page wrapper allocated a ~1920×4000 backing
  store (~30 MB) and simulated ~20,000 points per frame. `position: fixed` bounds
  it to one screen and reads better besides — `Waves` takes a `fixed` prop for
  exactly this.
- **Cap the frame rate.** A slow field is indistinguishable at 30fps and costs
  half as much. `fps` is a prop on the canvas components.
- **Hot loops use flat `Float32Array`s, not arrays of objects**, and hoist
  anything constant per row/column out of the inner loop. `Waves` exploits the
  grid's separability to skip two `Math.floor`s and two quintic fade curves per
  point.
- **Let settled state retire.** Per-point spring physics should snap to zero and
  then be skipped, so only points near the cursor cost anything.
- **Build gradients on resize, not per frame.** `createRadialGradient` in a draw
  call allocates a new object 60 times a second.
- **`strokeStyle` cannot resolve `var()` or `currentColor`.** Put the value on a
  CSS custom property and read it back with `getComputedStyle`, so canvas colours
  still follow the theme.
- **Pointer listeners must be `passive: true`** unless they genuinely call
  `preventDefault`. A non-passive `touchmove` blocks scrolling.
- **Do not poll the DOM on a timer.** A `setInterval` refocusing an input every
  100ms ran ten times a second forever and stole focus from real clicks.
  Listening for the events that lose focus does the same job at zero idle cost.
- **Blink and pulse effects belong in CSS.** A 1Hz `setState` re-renders the
  whole subtree — for the terminal that meant the entire scrollback, twice a
  second.
- `will-change` pins a compositor layer and costs memory. Apply the `animating`
  utility only while something is actually moving.

### React render cost, which is the other half of "fast"

Bundle size is not the problem on the signed-in surfaces; re-rendering is. The
REPL page had all of the following at once, and they compound:

- **A hook returning fresh function identities.** `useSocket`'s `emit`/`on`/
  `off` were rebuilt every render, and every consumer listed `emit` in a
  dependency array — so all the memoisation downstream was decorative. If a
  hook returns callbacks, memoise them; reaching through a ref makes an empty
  dependency list safe.
- **Object literals as props.** `<Sandbox editor={{ ... }} />` is a new
  reference every render, which makes `React.memo` below it a no-op. `useMemo`
  the prop object, or pass the fields flat.
- **State that is written and never read.** Three separate cases here
  (`isLoading`, `isTablet`, `terminalSearchTerm`) — each one a setter firing on
  every interaction to drive nothing. Grep before you add a flag.
- **`resize` listeners that call setters.** They fire for every pixel of a drag.
  Use `matchMedia` and listen for `change`, which fires only when a breakpoint
  is crossed.
- **A ref's `.current` in a dependency array.** It does nothing: React compares
  it on render, but mutating a ref does not schedule one. Read it at call time.
- **Work proportional to document size on every keystroke.** The editor ran a
  full `diff_match_patch` over the whole file per character. Coalesce on an idle
  window and flush on unmount.

Anything below the IDE shell (`Editor`, `FileTree`, `Terminal`, `Output`) must
stay `React.memo`'d — the shell owns eleven pieces of chrome state and every one
of them would otherwise re-render Monaco and xterm.

## The sandbox / IDE

`/repl/[slug]` is held to a different standard from the marketing site. It is a
tool someone keeps open all day.

- **Flat.** No gradients, no blur, no shadows, no rounded cards. Surfaces
  separate by a 1px `border-edge` and a step in lightness, the way an editor
  does. `rounded-xs`/`rounded-sm` at most.
- **Dense.** Rows around 22px, `font-mono` at `text-xs` for anything showing a
  path, an identifier or a state.
- **Quiet.** Amber marks the open file, the active panel and the cursor. Nothing
  else.
- Shared chrome lives in `components/sandbox/chrome.tsx`: `IconButton`,
  `PanelTab`, `StatusBar`, `StatusItem`, `EmptyEditorState`. Use them rather
  than restyling a `Button` at the call site.
- **`IconButton` requires `label`** — it is enforced by the type. `title` alone
  is a tooltip, not an accessible name, and screen readers announced the entire
  IDE chrome as "button".
- A state that has not started is **grey**, not red. Red is for something that
  went wrong; painting "terminal not opened yet" as an error trains people to
  ignore red.
- The editor and docs share one syntax palette —
  `components/sandbox/Editor/theme.ts` (Monaco) and `lib/docs/shiki-theme.ts`
  (Shiki). **Change both together.** A reader goes from a docs snippet straight
  into the editor, and a keyword coloured two different ways makes the product
  feel assembled from parts.

## Documentation

Docs are **authored MDX** under `content/docs/`. They are no longer scraped from
GitHub READMEs — that pipeline published `PULL_REQUEST_TEMPLATE` and
`BUG_TEMPLATE` as documentation pages, required a `GITHUB_TOKEN` and network
access at build time, and shipped a 448 kB client bundle. It is gone. Do not
reintroduce it.

Adding a file to `content/docs/` publishes a page. Sidebar, search index,
sitemap, breadcrumbs and metadata all derive from `lib/docs/source.ts`.

Frontmatter — the build **throws** without `title` and `description`,
deliberately, because a missing description means a blank meta tag and an empty
search result:

```yaml
---
title: Page title
description: One sentence, written for someone who has not landed on the page yet. This is the meta description and the search snippet.
section: Guides      # sidebar group; see SECTION_ORDER in lib/docs/source.ts
order: 3             # sort within the section
---
```

Also supported: `hidden` (routable and indexed, absent from the sidebar) and
`draft` (`noindex`, excluded from the sitemap).

MDX components: `<Callout type="info|tip|warning|danger">`, `<Cards>`/`<Card>`,
`<Steps>` — defined in `components/docs/mdx-components.tsx`. Code blocks are
highlighted by Shiki at **build time**; no highlighter JavaScript reaches the
browser. Keep it that way.

Write docs as prose that explains *why*, not a reformatted API dump. Say what
breaks and what the constraint is — a reader on the page is usually already
stuck.

Code blocks use the theme in `lib/docs/shiki-theme.ts`, wired into
`next.config.ts`. It is a **single** theme, not a light/dark pair: the docs are
dark-only, and a pair makes `rehype-pretty-code` emit both sets of inline
colours on every token.

Affordances in the docs must not be hover-only. The copy button used to be
`opacity-0` until `group-hover`, which means it did not exist on a phone.

## SEO

`lib/site.ts` holds the canonical facts; `lib/seo.ts` builds metadata and
JSON-LD. Use `buildMetadata()` for every new public route instead of
hand-writing a `metadata` export — it guarantees a canonical URL, OG tags and a
Twitter card.

- `NEXT_PUBLIC_SITE_URL` **must** be set to the production origin at deploy time.
  Unset, the app falls back to localhost and `robots.ts` flips to `Disallow: /`
  — correct for a preview, wrong for production.
- `metadataBase` in `app/layout.tsx` is what makes relative canonical and OG
  paths resolve to absolute URLs. Without it, crawlers ignore them.
- `app/sitemap.ts` and `app/robots.ts` must stay consistent. Never list a URL in
  the sitemap that robots disallows.
- Sitemap `lastModified` comes from the last **git commit** touching each MDX
  file, not filesystem mtime — in CI a fresh clone stamps every file with the
  checkout time, telling search engines the whole site changed at once.
- **Do not mark HTML `immutable`.** Docs are prose that gets corrected; the old
  `max-age=31536000, immutable` header meant a returning reader could not see a
  fix for a year. Hashed `/_next/static/*` assets are the only immutable things
  here.

## Where the UI research lives

Deep component-library and stack research is written up outside the repo, at
`~/code/sandbox/void/ui/`:

| File | Contents |
| --- | --- |
| `rareui.md` | RareUI components with full source; registry at `/r/<kebab-name>.json` |
| `skiper-ui.md` | skiper-ui registry (106 components, 37 free) + perf triage |
| `opensourceui.md` | opensourceui full inventory and source |
| `starred-repos.md` | Categorised audit of the maintainer's starred UI/animation/docs repos |
| `docs-mdx-seo.md` | MDX stack comparison + Next 15 SEO API reference |
| `email.md` | Email client support matrix, dark mode, bulletproof patterns |

A second, deeper round is under `~/code/sandbox/void/ui/v2/`:

| File | Contents |
| --- | --- |
| `reactbits.md` | 171 components, full source for 16 backgrounds and 12 text animations |
| `rareui-deep.md` | HookSidebar / FluidOrb / GridReveal in depth |
| `trees-skiper-orbs.md` | File-tree library comparison, skiper26/67, thinking-orbs |
| `design-references.md` | 18 dev-tool sites measured from shipped CSS; brand-hue census |
| `refs-clerk-neon-supabase.md` | Elevation, borders, motion timing techniques |
| `registries-auth.md` | 12 component registries, licences, per-component landmines |
| `typography.md`, `typography-display.md` | Face selection, measured metrics, next/font snippets |
| `sandbox-audit.md` | Structural + perf audit of the IDE, with file:line findings |
| `protected-route-regressions.md` | Verified regression audit (all fixed) |

Consult these before adding a component library — several carry per-component
performance verdicts and known upstream bugs.

**Licence landmines found in that survey**, so nobody re-discovers them:

- **Origin UI relicensed MIT → AGPL-3.0.** Network copyleft against a hosted
  IDE. Do not install it. (Nothing currently depends on it.)
- **Aceternity ships no LICENSE**, and every auth block is paywalled (`401`).
- **shadcnblocks' free tier is proprietary** and not redistributable in a
  public repo.
- **21st.dev's terms forbid off-platform retrieval.**
- **watermelon `auth-09` does not exist** — `registry.watermelon.sh/r/*.json`
  404s repo-wide, and the underlying block is a sign-up page with no tokens.

One finding worth repeating because it is easy to get wrong: **WebGL-based
avatar fallbacks do not work in lists.** Chrome caps live WebGL contexts at
roughly 8–16, so the ninth avatar kills the first. If you want the FluidOrb look
for avatars, draw a single deterministic frame seeded from the user id rather
than running a context per avatar.
