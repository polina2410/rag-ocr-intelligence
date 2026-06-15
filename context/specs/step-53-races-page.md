# Implementation Task: /races Page

## What to build
Replace the placeholder `RacesPage` stub with a data-driven page that fetches the
first page of races and renders them as a responsive grid of `RaceCard`
components, with a `SkeletonCard` grid as the loading fallback and simple text
states for error and empty results.

## Current state
- `apps/frontend/src/pages/RacesPage.tsx` — placeholder stub (`<h1>Races</h1>`). Must be replaced.
- `apps/frontend/src/api/races.ts` — exports `getRace(id): Promise<RaceDetailDto>` only. No `getRaces` yet.
- `apps/frontend/src/api/http.ts` — module-scoped Axios instance `http`, exported named.
- `apps/frontend/src/components/RaceCard.tsx` — `export const RaceCard`, props `{ race: RaceDto }`. Renders link + badge + details + hover stats. ✅ (no changes)
- `apps/frontend/src/components/SkeletonCard.tsx` — `export const SkeletonCard`, zero props. ✅ (no changes)
- `apps/frontend/src/components/PageWrapper.tsx` — `export const PageWrapper`, `{ children: ReactNode }`, max-width 1200px, `padding-inline: 24px`. ✅ (no changes)
- `apps/frontend/src/lib/queryClient.ts` — TanStack Query v5, `staleTime: 60_000`, `retry: 1`.
- `packages/types/src/paginated.dto.ts` — `PaginatedResponse<T> { data: T[]; total; page; limit }`.
- `packages/types/src/race.dto.ts` — `RaceDto { id, name, date, location, distanceKm, totalObstacles, raceType }`.
- Backend: `GET /races?page=1&limit=20` returns `PaginatedResponse<RaceDto>` (default limit 20).
- Confirmed convention: existing `RaceCardStats.tsx` uses TanStack Query v5 destructuring `{ data, isPending, isError }`.

## Deliverables (definition of done)
1. `getRaces(page?: number, limit?: number): Promise<PaginatedResponse<RaceDto>>` is added to `apps/frontend/src/api/races.ts`. Defaults: `page = 1`, `limit = 20`. It calls `http.get` against `/races` passing `page` and `limit` as query params, and returns `res.data`. `PaginatedResponse` and `RaceDto` are imported (type-only) from `@ocr/types`.
2. `RacesPage.tsx` is a `const` arrow component fetching data via `useQuery({ queryKey: ['races'], queryFn: () => getRaces() })` and still uses `export default`.
3. While `isPending` is true, the page renders a grid containing exactly `SKELETON_COUNT` (= 6) `<SkeletonCard />` instances. `SKELETON_COUNT` is a named module constant (no magic number).
4. When `isError` is true, the page renders a single `<p>` with the exact text `Failed to load races.` (no retry button).
5. When data resolves and `data.data.length === 0`, the page renders a single `<p>` with the exact text `No races found.`
6. When data resolves with one or more races, the page renders one `<RaceCard race={race} />` per item in `data.data`, keyed by `race.id`.
7. All four states (loading, error, empty, success) are wrapped in `<PageWrapper>` and preceded by an `<h1>Races</h1>` heading that is always visible.
8. A co-located `RacesPage.module.css` defines the grid class: `display: grid`, `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, `gap: 24px`. No inline styles anywhere.
9. `pnpm --filter frontend lint` passes and `pnpm --filter frontend build` succeeds with no type errors.

## Rules that must hold
- Page components use `export default`; the component body is a `const` arrow function.
- No `any` — use the `PaginatedResponse<RaceDto>` generic from `@ocr/types`.
- HTTP calls go only through the `http` Axios instance in the `api/` layer; `RacesPage` must not call Axios directly.
- Styling via CSS Modules only; no inline styles; the 280px/24px/6 values live as CSS or named constants, not scattered literals.
- Use TanStack Query v5 state flags `isPending` / `isError` (match `RaceCardStats.tsx`), not the deprecated `isLoading`.
- One component per file. Do not modify `RaceCard`, `SkeletonCard`, or `PageWrapper`.
- No pagination, search, filter, or sort UI in this step.

## Build steps
1. Add `getRaces` to `apps/frontend/src/api/races.ts` (signature and defaults per Deliverable 1); add the `PaginatedResponse` / `RaceDto` type imports from `@ocr/types`.
2. Create `apps/frontend/src/pages/RacesPage.module.css` with the `.grid` class (Deliverable 8).
3. Rewrite `RacesPage.tsx`: import `useQuery`, `getRaces`, `RaceCard`, `SkeletonCard`, `PageWrapper`, and the CSS module. Define `SKELETON_COUNT = 6`.
4. Implement the query, then render `<PageWrapper>` → `<h1>Races</h1>` → conditional body: `isPending` (skeleton grid) → `isError` (error `<p>`) → empty (`<p>`) → success (race grid).
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; resolve any type/lint issues.

## Notes for the implementer
**Out of scope:** pagination controls, infinite scroll, search/filter/sort, per-card error handling (the card's own hover-stats query already self-manages), retry button, route registration changes (assume `/races` is already routed to this page — verify).
**Files likely affected:** `apps/frontend/src/api/races.ts` (edit), `apps/frontend/src/pages/RacesPage.tsx` (replace), `apps/frontend/src/pages/RacesPage.module.css` (new).
**Edge cases:** an error after a prior success still surfaces via `isError`; render the error `<p>` rather than stale data. The skeleton grid should use the same `.grid` container so layout does not shift between loading and loaded states. Skeleton list items need stable keys (index is acceptable for the fixed `SKELETON_COUNT` list since order never changes).
**Constraints / assumptions:**
- Assumes `getRaces()` with default `limit=20` returns enough races for this step; "fetch all in one request" is approximated by the default page — if total > 20 the rest are silently omitted (acceptable, no pagination this step).
- Assumes a `<Route path="/races">` already points at `RacesPage` (consistent with the existing stub being routed). VERIFY during step 4; if absent, flag back rather than adding routing here.