# Implementation Task: Framer Motion Parallax Hero Section on `/races`

## What to build
A scroll-driven parallax hero section rendered at the top of the `/races` page, above the existing race grid. As the user scrolls, layered hero elements (background and foreground/heading) move at different speeds using Framer Motion's `useScroll` + `useTransform`. The existing query, skeletons, and `RaceCard` grid remain unchanged below the hero.

## Current state
- `apps/frontend/src/pages/RacesPage.tsx` — renders `<PageWrapper>` containing a plain `<h1>Races</h1>` and `renderBody()` (skeleton/error/empty/grid states). The `<h1>` is what the hero will replace/absorb.
- `apps/frontend/src/pages/RacesPage.module.css` — only contains `.grid`.
- `apps/frontend/src/components/PageWrapper.tsx` / `PageWrapper.module.css` — wraps content in a `max-width: 1200px`, centered column with `padding-inline: 24px`.
- `apps/frontend/src/components/RootLayout.tsx` — wraps all pages, provides `CursorProvider`, mounts `CursorDot`/`CursorHint`/`CursorMagnifier`.
- `apps/frontend/src/components/CursorDot.tsx` — existing Framer Motion usage pattern (`import { motion } from 'framer-motion'`, `motion.div`, named numeric constants).
- `apps/frontend/src/components/CursorHint.tsx` — uses `AnimatePresence, motion`.
- `apps/frontend/src/index.css` — defines design tokens (`--color-accent: #6366f1`, `--color-text`, `--color-surface`, etc.), `box-sizing: border-box`, and globally `body { cursor: none }`.
- Packages: `framer-motion` v12.40.0 (installed), React 19, TypeScript, Vite, CSS Modules. No Tailwind. No existing `useScroll`/`useTransform`/`useReducedMotion` usage anywhere in the codebase.
- Conventions (CLAUDE.md): TypeScript, no `any`, named exports for components, `const` arrow-function components, no magic numbers (named constants), no inline styles (CSS or CSS Modules), one component per file.

## Deliverables (definition of done)
1. New component file `apps/frontend/src/components/RacesHero.tsx` exporting `const RacesHero` as a named export.
2. New `apps/frontend/src/components/RacesHero.module.css` containing all hero styling (no inline styles except Framer Motion `style` props bound to `MotionValue`s, which are required by the API).
3. `RacesHero` renders the page title text "Races" inside a single `<h1>` (the existing `<h1>Races</h1>` in `RacesPage.tsx` is removed so only one `h1` exists on the page).
4. The hero contains at least two layers that translate vertically at different rates on scroll: a background layer and a foreground (heading) layer, driven by `useScroll` + `useTransform`.
5. `useScroll` is configured with a `target` ref and `offset` so the parallax is tied to the hero element's position in the viewport (not the whole document), and the hero animates as the user scrolls past it.
6. All numeric tuning values (hero height, parallax travel distances in px, scroll offset breakpoints) are declared as named constants — no magic numbers inline.
7. `RacesPage.tsx` renders `<RacesHero />` as the first child inside `<PageWrapper>`, above `renderBody()`.
8. When the user's OS has `prefers-reduced-motion: reduce`, the parallax transform is disabled (layers stay static); implemented via Framer Motion `useReducedMotion()`.
9. The hero does not break the existing loading/error/empty/grid states — `renderBody()` output is unchanged and still appears below the hero.
10. `pnpm --filter frontend lint` passes and `pnpm --filter frontend build` succeeds with no TypeScript errors.
11. No `any` types; all refs and MotionValues are properly typed.

## Rules that must hold
- No inline styles except the Framer Motion `style={{ y: motionValue }}` bindings (unavoidable per the API); all visual styling lives in `RacesHero.module.css`.
- Use design tokens from `index.css` (`var(--color-accent)`, `var(--color-text)`, etc.) for colors — no new hardcoded hex values unless adding a new token to `:root` in `index.css`.
- Exactly one `<h1>` on the rendered `/races` page (accessibility / SEO).
- Named exports for the component; `const` arrow function; one component per file.
- No magic numbers — extract named constants.
- Backward compatible: the `useQuery(['races'])`, skeleton, error, empty, and grid rendering must be unchanged.
- Do not modify `RootLayout`, `CursorProvider`, or any cursor-engine component.
- `framer-motion` is already installed — do not add new dependencies.

## Build steps
1. Create `RacesHero.tsx`. Define a container ref (`useRef<HTMLElement>(null)`) on the hero root element.
2. Wire `useScroll({ target: ref, offset: [...] })` to get `scrollYProgress`. Define the `offset` as named constants (e.g. start/end strings like `'start start'` / `'end start'`).
3. Create one or more `useTransform(scrollYProgress, [0, 1], [0, TRAVEL_PX])` MotionValues for the background and foreground layers, using distinct named travel constants so layers move at different speeds.
4. Call `useReducedMotion()`; when true, bind layer `style.y` to `0` (or omit the transform) so layers are static.
5. Render layered markup: a background `motion.div` (decorative, `aria-hidden`) and a foreground `motion.div` containing the `<h1>Races</h1>` heading.
6. Add `RacesHero.module.css`: hero height constant, `position: relative` container, absolutely-positioned/stacked background layer, foreground layer with the title typography. Use design tokens. Ensure `overflow: hidden` on the hero so translated background does not leak.
7. Edit `RacesPage.tsx`: remove the existing `<h1>Races</h1>`, import `RacesHero`, and render `<RacesHero />` as the first child inside `<PageWrapper>` before `{renderBody()}`.
8. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
- **Reduced motion:** prefer `useReducedMotion()` (JS) over a CSS-only approach, since the movement is driven by JS MotionValues that CSS cannot override.
- **Scroll target:** `useScroll` `target` must point to the hero element. Verify the ref type matches the rendered element (`HTMLElement`/`HTMLDivElement`). Framer Motion v12 expects a `RefObject`.
- **Cursor engine interaction:** `body { cursor: none }` is global and `CursorMagnifier` reads `data-cursor-magnifier` / `CursorHint` reads `data-cursor-hint`. The hero does not need these attributes unless desired — out of scope here.
- **Layout width:** `PageWrapper` already constrains width to 1200px with 24px inline padding. The hero background is contained within `PageWrapper` (simplest, no layout changes needed).
- **Out of scope:** images/video backgrounds, copy/marketing text beyond the "Races" title, CTA buttons, mobile-specific parallax tuning beyond ensuring it renders, animating the race grid, fetching any new data.
- **Files likely affected:** `apps/frontend/src/components/RacesHero.tsx` (new), `apps/frontend/src/components/RacesHero.module.css` (new), `apps/frontend/src/pages/RacesPage.tsx` (edit), optionally `apps/frontend/src/index.css` (only if a new color token is needed).

**Open questions (non-blocking; flag with reviewer):**
1. **Full-bleed vs. contained hero** — Should the parallax background span the full viewport width or stay contained in `PageWrapper`'s 1200px column? Spec assumes contained.
2. **Hero content** — Just the "Races" title, or also a subtitle/race count? Spec assumes title only.
3. **Hero height** — No target height specified. Implementer should pick a reasonable constant (e.g. 40–60vh).
