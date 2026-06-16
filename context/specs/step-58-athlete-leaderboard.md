# Implementation Task: AthleteLeaderboard

## What to build
A sortable HTML table component that renders an array of `RaceResultDto` as a race leaderboard, showing position, athlete name, category badge, finish time, overall place, and category place. It supports client-side sorting by column and filters its rows by an optional `categoryFilter` prop passed from the parent.

## Current state
- `apps/frontend/src/components/CategoryFilter.tsx` — separate component owned by the parent; emits `value: string | null` via `onChange`. AthleteLeaderboard does NOT render it.
- `packages/types/src/race-detail.dto.ts` — `RaceResultDto`: `{ id, athlete: AthleteDto, overallPosition: number | null, finishTimeSeconds: number | null, status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ', categoryPosition: number | null, genderPosition: number | null, splits }`. Import via `@ocr/types`.
- `packages/types/src/athlete.dto.ts` — `AthleteDto`: `{ id, firstName, lastName, nationality, category }`.
- `apps/frontend/src/components/SkeletonTable.tsx` + `SkeletonTable.module.css` — loading placeholder with 6 columns whose widths the real table must match: position 24px, name 140px, category 64px, time 72px, place 32px, place 32px. Shared cell styling: `padding: 12px 8px; border-bottom: 1px solid var(--color-border); border-collapse: collapse`.
- `apps/frontend/src/components/Badge.tsx` — `Badge({ label, variant })`; variant drives color via `data-variant`. Known variants in CSS: `Sprint`, `Super`, `DEKA`, `Open` (unknown variants fall back to neutral gray).
- `apps/frontend/src/components/ObstacleSplitChart.tsx` — reference for component conventions: named export, `const` arrow component, typed props interface, CSS module import, `formatMmss` time formatter (`SECONDS_PER_MINUTE = 60`, `m:ss`).
- `apps/frontend/src/components/RaceCard.module.css` — reference for hover/interactive CSS (`border-color`/`box-shadow` transition using `--color-accent`).
- `apps/frontend/src/index.css` — available CSS tokens: `--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-danger`, `--font-size-sm`. No new global tokens may be added.
- No `AthleteLeaderboard.tsx` exists yet — this is a net-new file.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/AthleteLeaderboard.tsx` exporting a named `const` arrow component `AthleteLeaderboard`.
2. New file `apps/frontend/src/components/AthleteLeaderboard.module.css` for all styling (no inline styles).
3. Exported props interface `AthleteLeaderboardProps`:
   - `results: RaceResultDto[]`
   - `categoryFilter: string | null`
4. Renders a `<table>` with a `<thead>` containing exactly 6 columns in this order: Position, Name, Category, Finish Time, Overall, Category place. Column widths match SkeletonTable (24/140/64/72/32/32 px).
5. Each body row renders one filtered/sorted `RaceResultDto`:
   - Position: `overallPosition`, or `—` when null.
   - Name: `${athlete.firstName} ${athlete.lastName}`.
   - Category: `<Badge label={athlete.category} variant={athlete.category} />`.
   - Finish Time: `finishTimeSeconds` formatted as `m:ss` when status is `FINISHED` and value is non-null; otherwise the status string (`DNF` / `DNS` / `DSQ`), or `—` if status is `FINISHED` but time is null.
   - Overall: `overallPosition` or `—`.
   - Category place: `categoryPosition` or `—`.
6. When `categoryFilter` is non-null, only rows where `athlete.category === categoryFilter` render. When null, all rows render.
7. Sorting: clicking a sortable column header sorts rows by that column; clicking the same header again toggles ascending/descending. Sort state is local `useState` inside the component (component owns its own sort state, not the parent).
8. Default sort: by `overallPosition` ascending, with null-position rows last.
9. Rows with null sort values always sort to the bottom regardless of asc/desc direction.
10. The active sort column header shows a visible sort-direction indicator (▲ / ▼).
11. Empty state: when the filtered result set is empty, render a single `<tr>` with a `<td colSpan={6}>No results.</td>` instead of an empty table body.
12. `pnpm --filter frontend lint` passes; `pnpm --filter frontend build` succeeds with no TypeScript errors.
13. `<th>` sort triggers are `<button>` elements inside `<th>` with `aria-sort` set on the active column header (`"ascending"` / `"descending"` / `"none"`).

## Rules that must hold
- TypeScript only — no `any`. Use `RaceResultDto` / `AthleteDto` from `@ocr/types`.
- One component per file; named export; `const` arrow function.
- Styling via CSS Module only — no inline styles. Reuse existing CSS tokens from `index.css`; do not hardcode colors.
- No HTTP calls and no data fetching — purely presentational.
- Do not mutate the `results` prop array — sort and filter on a copy.
- Column count, order, and pixel widths must match `SkeletonTable` exactly to prevent layout shift.
- Time formatting must use `SECONDS_PER_MINUTE = 60` constant and produce `m:ss` (seconds zero-padded to 2 digits), matching the convention in `ObstacleSplitChart.tsx`.
- Sort state lives in this component; filter state (which category is selected) lives in the parent.

## Build steps
1. Create `AthleteLeaderboard.module.css` with `.table`, `.cell`, `.th`, `.sortBtn`, column-width classes, and a hover/focus style on `.sortBtn` using `--color-accent`.
2. Create `AthleteLeaderboard.tsx`; import `RaceResultDto` from `@ocr/types` and `Badge` from `./Badge`.
3. Define `AthleteLeaderboardProps` and export it alongside the component.
4. Define `SECONDS_PER_MINUTE = 60` and `formatTime(seconds: number): string` (`m:ss`, zero-padded).
5. Define `type SortKey = 'overallPosition' | 'finishTimeSeconds' | 'name' | 'categoryPosition'` and `type SortDir = 'asc' | 'desc'`.
6. Add `useState<{ key: SortKey; dir: SortDir }>` defaulting to `{ key: 'overallPosition', dir: 'asc' }`.
7. Derive display rows: filter `results` by `categoryFilter`, then sort by active key (null values always last), returning a new array.
8. Render `<thead>` with a sortable `<button>` in each sortable `<th>`; set `aria-sort` on the active header; show ▲/▼ indicator.
9. Render `<tbody>`: map rows to `<tr key={result.id}>` with 6 `<td>` cells per Deliverable 5; show empty state row when no rows.
10. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
**Out of scope:** rendering the `CategoryFilter` dropdown (parent does this in Step 59); pagination; `genderPosition` column; row click/navigation; responsive redesign; virtualization.

**Edge cases:**
- All four statuses must display: `FINISHED` → formatted time; `DNF`/`DNS`/`DSQ` → status text in Finish Time cell.
- `overallPosition`, `categoryPosition`, and `finishTimeSeconds` can each independently be `null` — render `—` and sort such rows last regardless of direction.
- A `FINISHED` row with null `finishTimeSeconds` → render `—`, no crash.
- Sort by `name` uses locale string comparison on `${firstName} ${lastName}`.

**Gotchas:**
- Keep column widths in `px` (not `%`) to match `SkeletonTable` and prevent layout shift.
- The Position column and Overall column both display `overallPosition` — they can share the same sort key; clicking either header sorts by the same value.
- `categoryFilter` matches `athlete.category` by exact string equality — no case normalization needed here.
- Unknown `athlete.category` values render as neutral-gray `Badge` (no crash, just no color match in CSS).