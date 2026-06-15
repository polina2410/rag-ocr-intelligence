# Implementation Task: SkeletonCard Component

## What to build
A presentational `SkeletonCard` component that renders a fixed-shape, animated loading placeholder visually matching the footprint of the upcoming `RaceCard` (step 51). It accepts no props and uses a CSS shimmer animation. It is used as the loading fallback in the `/races` grid (step 53), rendered as multiple `<SkeletonCard />` instances directly.

## Current state
- `apps/frontend/src/components/` — holds `Badge.tsx`, `PageWrapper.tsx`, `Navbar.tsx`, `RouteFallback.tsx`. No skeleton components exist yet.
- `apps/frontend/src/components/RouteFallback.module.css` — established local `@keyframes spin` animation pattern. Follow the same "define `@keyframes` in the module CSS" approach.
- `apps/frontend/src/index.css` — `:root { --color-accent: #6366f1; --color-border: #e5e7eb; }`. Global `box-sizing: border-box`. No spacing/radius tokens.
- `RaceCard` (step 51, not yet built) will display: race name, date, location, distance (km), obstacle count. The skeleton approximates this layout: title block, badge block, then two detail-line blocks.
- React 19.2.6, TypeScript ~6.0.2, Vite 8. CSS Modules only — no inline styles, no Tailwind.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/SkeletonCard.tsx` exporting a named `const` arrow component `SkeletonCard`.
2. `SkeletonCard` takes no props whatsoever.
3. New file `apps/frontend/src/components/SkeletonCard.module.css` — the only stylesheet for the component.
4. The component renders a card container with: white background, `1px solid var(--color-border)` border, `border-radius: 8px`, `padding: 16px`.
5. Inside the card, top-to-bottom: (a) one title shimmer block (~60% width, ~20px height), (b) one badge-width shimmer block (~30% width, ~16px height), (c) two detail-line shimmer blocks (~80% width, ~14px height each). The badge block and first detail line are separated by a larger gap than the gap between the two detail lines.
6. A single `.shimmer` class in the CSS Module provides the animated gradient fill, shared across all four blocks.
7. `.shimmer` uses a linear-gradient with hardcoded `#e5e7eb` and `#f3f4f6` (NOT `var(--color-accent)` or `var(--color-border)`), `background-size: 200% 100%`, and references a local `@keyframes shimmer` block.
8. `@keyframes shimmer` animates `background-position` from `100% 0` to `-100% 0` (left-to-right sweep), looping infinitely.
9. Block dimension classes (`.title`, `.badge`, `.line`) carry width/height/border-radius; `.shimmer` carries only the animation + gradient. Each block applies both its dimension class and `.shimmer`.
10. `pnpm --filter frontend lint` passes; `pnpm --filter frontend build` succeeds.

## Rules that must hold
- No props on `SkeletonCard` of any kind.
- No inline styles — all styling in `SkeletonCard.module.css`.
- Card border uses `var(--color-border)`; shimmer fill uses hardcoded `#e5e7eb` / `#f3f4f6` only.
- `@keyframes` defined locally in the module CSS file, not globally.
- Named `const` arrow function, named export, one component per file, no `any` types.
- No new global CSS tokens in `index.css`.

## Build steps
1. Create `SkeletonCard.module.css`: define `.card` (white bg, `var(--color-border)` border, `border-radius: 8px`, `padding: 16px`, flex column with a gap or margins).
2. Define `.shimmer`: `background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%)`, `background-size: 200% 100%`, `animation: shimmer 1.4s ease-in-out infinite`, `border-radius: 4px`.
3. Define `@keyframes shimmer { from { background-position: 100% 0 } to { background-position: -100% 0 } }`.
4. Define `.title` (~60% width, 20px height), `.badge` (~30% width, 16px height), `.line` (~80% width, 14px height).
5. Create `SkeletonCard.tsx`: import styles; export `const SkeletonCard`; render `.card` with four shimmer blocks applying dimension + shimmer classes via template literals (`` `${styles.title} ${styles.shimmer}` `` etc.).
6. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
**Out of scope:** `RaceCard` (step 51), `/races` grid (step 53), `SkeletonTable`/`SkeletonChart` (steps 49–50), a `count` prop, dark-mode theming, `prefers-reduced-motion` handling.

**Files affected:** `SkeletonCard.tsx` (new), `SkeletonCard.module.css` (new). No existing files modified.

**Gotchas:**
- Two classes on one element: `` className={`${styles.title} ${styles.shimmer}`} ``.
- Do not hardcode a fixed card width — the grid in step 53 controls width. The card should expand to fill its grid cell.
- `box-sizing: border-box` is global, so `padding: 16px` inside a percentage-width container is safe.