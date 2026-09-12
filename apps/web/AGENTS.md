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
| Status | `success`, `warning`, `danger`, `info` |
| Terminal chrome | `term-bg`, `term-chrome`, `term-edge`, `term-ink`, `term-muted`, `term-accent` |

Two naming traps:

- **`brand` is the emerald accent. `accent` is not.** `accent` keeps its shadcn
  meaning — a subtle raised background for menu and dropdown hover — because a
  lot of vendored Radix code depends on it. Mapping `accent` to the brand colour
  turns every dropdown row bright green.
- Prefer the existing utilities over re-deriving an effect inline: `glass`,
  `glow-brand`, `text-gradient-brand`, `surface-card`.

Motion tokens: `--duration-fast|normal|slow|slower` and the easings
`--ease-out-quad`, `--ease-out-expo`, `--ease-spring`. Write
`duration-[--duration-normal]`, not a hardcoded `duration-200`, so retiming the
app stays a one-line edit.

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

Consult these before adding a component library — several carry per-component
performance verdicts and known upstream bugs.

One finding worth repeating because it is easy to get wrong: **WebGL-based
avatar fallbacks do not work in lists.** Chrome caps live WebGL contexts at
roughly 8–16, so the ninth avatar kills the first. If you want the FluidOrb look
for avatars, draw a single deterministic frame seeded from the user id rather
than running a context per avatar.
