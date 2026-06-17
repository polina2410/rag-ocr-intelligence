# Implementation Task: Mobile and Tablet Responsiveness

## What to build
Add `@media` breakpoint rules to the five layout areas that overflow or look broken on viewports ≤ 480px. Everything else is already responsive (the RacesPage and RaceDetailPage grids use `auto-fill`/`auto-fit`, the Navbar already has a 480px query, AskPage and ChatInput are flex columns). No new components, no JS changes.

## Current state
- **`apps/frontend/src/index.css`** — one breakpoint token comment-reference: none. No CSS custom properties for breakpoints (can't use CSS vars in `@media`).
- **`apps/frontend/src/components/PageWrapper.module.css`** — `padding-inline: 24px` at all sizes. No media query.
- **`apps/frontend/src/components/AthleteLeaderboard.module.css`** — `.table { width: 100%; }` with fixed column widths that sum to ~412px (including padding). No scroll container. Overflows at 375px viewport (343px available at 16px side padding).
- **`apps/frontend/src/components/AthleteLeaderboard.tsx:116`** — `<table className={styles.table}>` rendered directly, no wrapping div.
- **`apps/frontend/src/components/ChatMessage.module.css`** — `.bubble { max-width: 70%; }`. At 375px, 70% ≈ 245px — AI responses become very narrow.
- **`apps/frontend/src/components/RacesHero.module.css`** — `margin-bottom: 48px`. Large whitespace on small screens.
- **`apps/frontend/src/components/RaceHeader.module.css`** — `.meta { display: flex; align-items: center; gap: 8px; }`. No `flex-wrap` — badge row can overflow on very narrow screens.
- **Already responsive (no changes):** ✅ RacesPage grid (`auto-fill minmax(280px, 1fr)`), ✅ RaceDetailPage charts (`auto-fit minmax(320px, 1fr)`), ✅ Navbar (has `@media (max-width: 480px)`), ✅ AskPage/ChatInput/ChatHistory, ✅ DropZone, ✅ UploadPage.

## Deliverables (definition of done)
1. `PageWrapper.module.css` has `@media (max-width: 480px)` reducing `padding-inline` to `16px`.
2. `AthleteLeaderboard.tsx` wraps `<table>` in `<div className={styles.tableScroll}>`. `AthleteLeaderboard.module.css` defines `.tableScroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }`.
3. `ChatMessage.module.css` has `@media (max-width: 480px)` increasing `.bubble { max-width }` to `88%`.
4. `RacesHero.module.css` has `@media (max-width: 480px)` reducing `.hero { margin-bottom }` from `48px` to `24px`.
5. `RaceHeader.module.css` `.meta` gains `flex-wrap: wrap` (unconditional — safe at all widths).
6. `pnpm --filter frontend lint` passes with no new errors.
7. `pnpm --filter frontend build` succeeds.

## Rules that must hold
- Breakpoint value for mobile is `480px` (already used by Navbar — must be consistent).
- No inline styles; all changes in `.module.css` files or through className on the wrapper div.
- Do not change any desktop (>480px) layout, colors, spacing, or typography.
- No Tailwind, no new dependencies, no JS changes beyond the wrapper div in `AthleteLeaderboard.tsx`.
- Do not add media queries for things already responsive.

## Build steps
1. **`PageWrapper.module.css`** — append:
   ```css
   @media (max-width: 480px) {
     .wrapper {
       padding-inline: 16px;
     }
   }
   ```
2. **`AthleteLeaderboard.module.css`** — append:
   ```css
   .tableScroll {
     overflow-x: auto;
     -webkit-overflow-scrolling: touch;
   }
   ```
3. **`AthleteLeaderboard.tsx`** — wrap the `<table className={styles.table}>` element in `<div className={styles.tableScroll}>`. The table itself and all its contents are unchanged.
4. **`ChatMessage.module.css`** — append:
   ```css
   @media (max-width: 480px) {
     .bubble {
       max-width: 88%;
     }
   }
   ```
5. **`RacesHero.module.css`** — append:
   ```css
   @media (max-width: 480px) {
     .hero {
       margin-bottom: 24px;
     }
   }
   ```
6. **`RaceHeader.module.css`** — add `flex-wrap: wrap;` to the existing `.meta` rule (no media query needed).
7. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; confirm both pass.

## Notes for the implementer
- `AthleteLeaderboard.tsx` is the only TSX file that changes — only to add the wrapper div and import the new `.tableScroll` class from the existing `styles` object. No logic changes.
- `-webkit-overflow-scrolling: touch` is a legacy property but harmless and still aids momentum scrolling on older iOS Safari.
- The `RaceHeader .meta` `flex-wrap: wrap` is safe at all viewport widths — on desktop it just never wraps because there's enough space.
- Do not touch `RacesPage.module.css` or `RaceDetailPage.module.css` — their CSS Grid declarations are already fluid.
- Verify the build produces no TypeScript errors on the `AthleteLeaderboard.tsx` wrapper div (it won't — it's a plain `div` with a valid style key).
