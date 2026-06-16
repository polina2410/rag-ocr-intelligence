# Current Feature: Race Detail Dashboard Page

## Status
Implemented — pending review

## Goals

- Rewrite `apps/frontend/src/pages/RaceDetailPage.tsx` as a `const` arrow component with a default export.
- Read `id` via `useParams<{ id: string }>()`; fetch with `useQuery({ queryKey: ['race', id], queryFn: () => getRace(id) })`, `enabled: Boolean(id)`.
- Missing `id` → not-found state, not a crash.
- `isPending` → skeleton placeholders for chart and table regions (`SkeletonChart`, `SkeletonTable`), wrapped in `PageWrapper`.
- `isError` → visible failure message inside `PageWrapper`; no unhandled error escapes to `ErrorBoundary`.
- Success state renders, in order: `RaceHeader` → `ObstacleSplitChart` + `PenaltyRateChart` → `CategoryFilter` → `AthleteLeaderboard`, each with the props defined in Current state below.
- Derive `categories: string[]` from `race.results` — distinct, non-empty `result.athlete.category` values, no duplicates.
- Page-level `useState<string | null>(null)` for selected category; wired into `CategoryFilter` (`value`/`onChange`) and `AthleteLeaderboard` (`categoryFilter`).
- Category derivation memoized (`useMemo` keyed on `race.results`), computed unconditionally (not inside a conditional branch) to preserve hook ordering.
- New co-located `RaceDetailPage.module.css` for page layout — charts side-by-side on wide viewports, stacked on narrow; no inline styles.
- `pnpm --filter frontend lint` passes; `pnpm --filter frontend build` succeeds with no new TypeScript errors.
- No backend, `packages/types`, or `apps/frontend/src/api/` file is modified.

## Notes

- Spec file: `context/specs/step-59-race-detail-dashboard-page.md`
- Current placeholder being replaced: `const RaceDetailPage = () => { const { id } = useParams<{ id: string }>(); return <h1>Race Detail: {id}</h1> }`.
- `getRace(id: string): Promise<RaceDetailDto>` already exists in `apps/frontend/src/api/races.ts` — do not add a new API function or call Axios/`http` directly.
- `RaceDetailDto extends RaceDto { results: RaceResultDto[] }`; `RaceResultDto.athlete: AthleteDto` (category lives at `result.athlete.category`).
- `RaceHeader` takes `{ race: RaceDto }` — pass the fetched `RaceDetailDto` directly, no field mapping needed (it satisfies `RaceDto`).
- `ObstacleSplitChart` / `PenaltyRateChart` both take `{ results: RaceResultDto[] }`.
- `CategoryFilter` takes `{ categories: string[]; value: string | null; onChange }` — already renders its own "All categories" option; do NOT add an "All" entry to the derived list.
- `AthleteLeaderboard` takes `{ results: RaceResultDto[]; categoryFilter: string | null }` — filters internally; do NOT pre-filter `results` before passing it in.
- Follow `RacesPage.tsx` / `RacesPage.module.css` conventions: `useQuery` + `isPending`/`isError` branches, a `renderBody()` helper, `<PageWrapper>` with a persistent `<h1>` (generic heading like "Race" while loading, swapped to `race.name` on success).
- Empty `race.results` → `categories` is `[]`, `AthleteLeaderboard` shows its built-in "No results." row; verify charts don't throw on empty data (if they do, treat as an open question — out of scope to edit chart internals).
- Out of scope: SSE/streaming (step 60), pagination, URL-syncing the selected category, backend/DTO changes, modifying composed child components.
- Files likely affected: `RaceDetailPage.tsx` (rewrite), `RaceDetailPage.module.css` (new) — no others.

## History

<!-- Completed features are tracked in context/features-history.md -->