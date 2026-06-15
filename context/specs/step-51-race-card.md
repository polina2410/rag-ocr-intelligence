# Implementation Task: RaceCard Component

## What to build
A presentational `RaceCard` component that displays a single race's five core fields (name, date, location, distance, obstacle count) plus a race-type badge. The entire card is a clickable link to that race's detail page. It receives all data via a single `race` prop and performs no data fetching.

## Current state
- `apps/frontend/src/components/Badge.tsx` — `Badge` + `BadgeProps { label: string; variant: string }`. `Badge.module.css` already styles all four `raceType` variants (`Sprint`, `Super`, `DEKA`, `Open`) — no changes to Badge needed.
- `apps/frontend/src/components/SkeletonCard.module.css` — card shell pattern to mirror: `background: #fff; border: 1px solid var(--color-border); border-radius: 8px; padding: 16px`.
- `apps/frontend/src/index.css` — `:root { --color-accent: #6366f1; --color-border: #e5e7eb; }`, global `box-sizing: border-box`.
- `apps/frontend/src/router.tsx` — route `/races/:id` already exists. Card links here.
- `packages/types/src/race.dto.ts` — `RaceDto { id, name, date (ISO string), location, distanceKm, totalObstacles, raceType }`. Import via `@ocr/types`.
- No frontend API layer yet — card is props-only, no fetching.
- Convention: named `const` arrow function, named export, one component per file, CSS Modules, no inline styles, no Tailwind. React 19.2.6, React Router DOM v7.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/RaceCard.tsx` exporting a named `const RaceCard` and a named `RaceCardProps` interface.
2. `RaceCardProps` declares exactly one prop: `race: RaceDto` imported from `@ocr/types`.
3. The outermost rendered element is a React Router `<Link to={`/races/${race.id}`}>` wrapping all card content. No plain `<a>` tag.
4. Card shell applied to the link/wrapper: white background, `1px solid var(--color-border)` border, `border-radius: 8px`, `padding: 16px`, vertical flex layout, `text-decoration: none`, `color: inherit`.
5. Content renders top-to-bottom: (a) race name, styled `font-weight: 600; font-size: 1rem`, (b) `<Badge label={race.raceType} variant={race.raceType} />`, (c) detail row with four items: formatted date, location, `"{distanceKm} km"`, `"{totalObstacles} obstacles"`.
6. Date formatted via `new Date(race.date)` + `Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })` — e.g. "15 Mar 2024". No external date library.
7. New file `apps/frontend/src/components/RaceCard.module.css` — all styles live here; no inline styles.
8. Card `:hover` applies a subtle accent change (e.g. `border-color: var(--color-accent)` and/or a light `box-shadow`).
9. `pnpm --filter frontend lint` passes.
10. `pnpm --filter frontend build` succeeds — no TypeScript errors.

## Rules that must hold
- No `any`; `race` typed as `RaceDto` from `@ocr/types`.
- Named export only. One component per file. CSS Modules only — no inline styles, no Tailwind.
- Use `var(--color-border)` and `var(--color-accent)` — do not hardcode their hex values.
- No data fetching inside the card; no `RaceCardStats` (step 52) or lazy-hover content.
- Whole card is the click target — `<Link>` wraps all content.
- Distance label: `"{distanceKm} km"` exactly. Obstacle label: `"{totalObstacles} obstacles"` exactly.

## Build steps
1. Create `RaceCard.module.css`: card-shell class (flex column, white bg, border, radius, padding), name heading class, detail row (flex, wrap, gap, small font), detail item class, and a `:hover` rule on the card using `var(--color-accent)`.
2. Create `RaceCard.tsx`: import `Link` from `react-router-dom`; import `type RaceDto` from `@ocr/types`; import `Badge`; import the CSS module.
3. Define a module-level date formatter: `const dateFormatter = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })`.
4. Export `RaceCardProps` and `const RaceCard`. Render `<Link>` with the card shell class, containing name, `<Badge>`, and detail row.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
**Out of scope:** `RaceCardStats` / hover-loaded stats (step 52); `/races` page grid (step 53); data fetching; pagination/sorting.

**Files affected:** `RaceCard.tsx` (new), `RaceCard.module.css` (new). No edits to `Badge`, router, or any existing file.

**Edge cases:** `distanceKm` may be non-integer — render as-is. `totalObstacles: 0` still renders `"0 obstacles"`. Malformed `race.date` produces `"Invalid Date"` — no defensive handling required (data assumed valid from `RaceDto`).

**Open questions (non-blocking):**
- Q1: Semantic heading level for race name (`<h2>`, `<h3>`, or styled `<span>`) — depends on the `/races` page heading hierarchy (step 53). Defaulting to `<span>` styled as a heading is safe for now.
- Q2: `"1 obstacles"` pluralization — not specified; leave as-is unless requested.