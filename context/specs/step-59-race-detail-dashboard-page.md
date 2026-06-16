# Implementation Task: `/races/:id` Race Detail Dashboard Page

## What to build
Replace the placeholder `RaceDetailPage` with a real dashboard page that fetches a single race by its route `id`, then composes the existing dashboard components (`RaceHeader`, `ObstacleSplitChart`, `PenaltyRateChart`, `CategoryFilter`, `AthleteLeaderboard`) into one layout. The page owns the selected-category state and derives the category list from the race results; it is frontend-only with no backend, DTO, or API changes.

## Current state
- `apps/frontend/src/pages/RaceDetailPage.tsx` — placeholder to replace: `const RaceDetailPage = () => { const { id } = useParams<{ id: string }>(); return <h1>Race Detail: {id}</h1> }`, default export.
- `apps/frontend/src/api/races.ts` — `getRace(id: string): Promise<RaceDetailDto>` already exists. No new API function needed.
- `packages/types/src/race-detail.dto.ts` — `RaceDetailDto extends RaceDto { results: RaceResultDto[] }`. `RaceResultDto.athlete: AthleteDto`, `status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`, `splits: ObstacleSplitDto[]`.
- `packages/types/src/race.dto.ts` — `RaceDto = { id, name, date, location, distanceKm, totalObstacles, raceType }`.
- `packages/types/src/athlete.dto.ts` — `AthleteDto = { id, firstName, lastName, nationality, category }`. Category lives at `result.athlete.category` (string).
- `apps/frontend/src/components/PageWrapper.tsx` — `{ children: ReactNode }`, named export `PageWrapper`.
- `apps/frontend/src/components/RaceHeader.tsx` — `interface RaceHeaderProps { race: RaceDto }`. `RaceDetailDto` satisfies `RaceDto`, so the fetched object is passed directly.
- `apps/frontend/src/components/ObstacleSplitChart.tsx` — `{ results: RaceResultDto[] }`.
- `apps/frontend/src/components/PenaltyRateChart.tsx` — `{ results: RaceResultDto[] }`.
- `apps/frontend/src/components/CategoryFilter.tsx` — `{ categories: string[]; value: string | null; onChange: (value: string | null) => void }`. Controlled; parent owns `categories` and `value`. Already renders its own "All categories" option (sentinel = `null`).
- `apps/frontend/src/components/AthleteLeaderboard.tsx` — `{ results: RaceResultDto[]; categoryFilter: string | null }`. Owns internal sort state and applies the category filter itself; receives the full `results` array plus the selected `categoryFilter`. Already renders a "No results." row when filtered set is empty.
- `apps/frontend/src/components/{SkeletonCard,SkeletonTable,SkeletonChart}.tsx` — zero/one-prop loading placeholders.
- `apps/frontend/src/pages/RacesPage.tsx` + `RacesPage.module.css` — reference for the page pattern: `useQuery` with `isPending`/`isError` branches, a `renderBody()` helper, `<PageWrapper>` with a persistent `<h1>`, co-located CSS module.
- Stack: React 19, Vite, TanStack Query, React Router DOM. Route `/races/:id` already wired (PLAN step 40).

## Deliverables (definition of done)
1. `apps/frontend/src/pages/RaceDetailPage.tsx` is rewritten as a `const` arrow component with a default export (matches existing routing/lazy import).
2. The component reads `id` via `useParams<{ id: string }>()` and fetches with `useQuery({ queryKey: ['race', id], queryFn: () => getRace(id) })`.
3. The query is enabled only when `id` is defined (e.g. `enabled: Boolean(id)`); when `id` is missing the page renders a not-found state, not a crash.
4. While `isPending`, the page renders skeleton placeholders for the chart and table regions (using `SkeletonChart` and `SkeletonTable`), wrapped in `PageWrapper`.
5. On `isError`, the page renders a visible failure message (e.g. "Failed to load race.") inside `PageWrapper`. No unhandled error escapes to the ErrorBoundary for the standard fetch-error case.
6. On success, the page renders, in order: `RaceHeader` (race), then both charts (`ObstacleSplitChart`, `PenaltyRateChart`), then `CategoryFilter`, then `AthleteLeaderboard` — each receiving the props defined in Current state.
7. The page derives `categories: string[]` from `race.results` as the distinct, non-empty set of `result.athlete.category` values, and passes that to `CategoryFilter`. The list contains no duplicates.
8. The selected category is page-level state: `const [selectedCategory, setSelectedCategory] = useState<string | null>(null)`, initialized to `null` (All). `CategoryFilter` receives `value={selectedCategory}` / `onChange={setSelectedCategory}`; `AthleteLeaderboard` receives `categoryFilter={selectedCategory}`.
9. The derived category list and any filtering inputs are memoized so they are not recomputed on every render unrelated to `race.results` (e.g. `useMemo` keyed on `race.results`).
10. A co-located `apps/frontend/src/pages/RaceDetailPage.module.css` exists and is used for page layout (no inline styles, no global CSS leakage). The two charts are laid out in a defined arrangement (e.g. side-by-side on wide viewports, stacked on narrow).
11. `pnpm --filter frontend lint` passes and `pnpm --filter frontend build` (typecheck) succeeds with no new errors.
12. No backend file, no `packages/types` file, and no `apps/frontend/src/api/` file is modified.

## Rules that must hold
- TypeScript only, no `any`. Use `RaceDetailDto` / `RaceResultDto` from `@ocr/types`.
- Page component uses a `const` arrow function and a default export (pages may default-export per CLAUDE.md; routing relies on it).
- Styles via the co-located CSS module only — no inline styles.
- HTTP only through the existing `getRace` in `api/races.ts`; do not call `http`/Axios directly from the page.
- Do not duplicate logic the child components already own: do NOT filter `results` by category before passing to `AthleteLeaderboard` (it filters internally), and do NOT add an "All" entry to the derived `categories` array (CategoryFilter renders it via its sentinel).
- Follow the `RacesPage` structure (single `<h1>` persistent across states + `renderBody()` helper) for consistency; the `<h1>` may show the race name once loaded but must render something safe before data arrives.
- Backward-compat: the `/races/:id` route and its lazy/Suspense boundary must keep working; the default export name/shape stays importable as before.

## Build steps
1. Replace the body of `apps/frontend/src/pages/RaceDetailPage.tsx`: import `useState`, `useMemo`, `useParams`, `useQuery`, `getRace`, the five dashboard components, `PageWrapper`, `SkeletonChart`, `SkeletonTable`, and the new CSS module.
2. Read `id` from `useParams`. Set up `useQuery` with key `['race', id]`, `queryFn: () => getRace(id!)`, and `enabled: Boolean(id)`.
3. Add `const [selectedCategory, setSelectedCategory] = useState<string | null>(null)`.
4. Add a `renderBody()` helper covering, in order: missing `id` → not-found; `isPending` → skeletons (chart + table); `isError` → error message; success → the composed dashboard.
5. In the success branch, compute `categories` via `useMemo(() => [...new Set(race.results.map(r => r.athlete.category).filter(Boolean))], [race.results])` (define the dedup at the top level of the component guarded so hooks are not called conditionally — derive from `data?.results ?? []`).
6. Lay out the success content: `<RaceHeader race={race} />`, a charts container (`ObstacleSplitChart` + `PenaltyRateChart`, each `results={race.results}`), `<CategoryFilter categories={categories} value={selectedCategory} onChange={setSelectedCategory} />`, `<AthleteLeaderboard results={race.results} categoryFilter={selectedCategory} />`.
7. Wrap everything in `<PageWrapper>` with a persistent heading; call `renderBody()` inside.
8. Create `RaceDetailPage.module.css` with classes for the page sections and the charts container (responsive grid/flex; stack on narrow). Reference `RacesPage.module.css` for conventions.
9. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; resolve any type/lint issues.

## Notes for the implementer
- **Hooks ordering (gotcha):** `useState`, `useQuery`, and the `useMemo` for `categories` must all run on every render in the same order. Do not place the `useMemo` inside the success branch of `renderBody`. Derive from `data?.results ?? []` at the top level, before the conditional returns.
- **Don't double-filter:** `AthleteLeaderboard` already filters by `categoryFilter` internally and `CategoryFilter` already injects the "All" option. Passing pre-filtered results or an "All"-augmented category list would be a bug.
- **`RaceDetailDto` is a `RaceDto`:** pass the whole fetched object as `race` to `RaceHeader` — no field mapping needed.
- **Empty results:** if `race.results` is empty, `categories` is `[]` (CategoryFilter shows only "All categories") and `AthleteLeaderboard` shows its built-in "No results." row. Charts receive `[]` — verify the chart components handle an empty array gracefully; if either chart throws on empty data, surface it as an open question rather than editing the chart (out of scope).
- **Category value casing:** dedup is exact-string based (`Set`). If results contain the same category with different casing/whitespace, they appear as distinct options — assumed acceptable for this iteration.
- **Out of scope:** SSE / live token streaming (PLAN step 60), pagination of results, URL-syncing the selected category (query param), backend changes, new DTOs, and any modification to the composed child components or chart internals.
- **Files likely affected:** `apps/frontend/src/pages/RaceDetailPage.tsx` (rewrite), `apps/frontend/src/pages/RaceDetailPage.module.css` (new). No others.
- **Open question (non-blocking):** Should the `<h1>` during loading read a generic "Race" or be omitted until the name loads? Default to a stable heading (e.g. "Race") swapped to `race.name` on success, matching the `RacesPage` persistent-heading pattern.