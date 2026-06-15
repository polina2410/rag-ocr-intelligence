# Implementation Task: RaceCardStats Component (lazy-mounted on hover)

## What to build
A `RaceCardStats` component that fetches a race's detail on mount and renders three derived stats (finisher count, average finish time, DNF rate). It is mounted conditionally by `RaceCard` only while the card is hovered, so the network request fires on first hover. This step also introduces the frontend Axios `api/` layer.

## Current state
- `apps/frontend/src/components/RaceCard.tsx` — `<Link>` wrapping name, `<Badge>`, details `<ul>`. No hover state. Uses `race.id`. Must be updated.
- `apps/frontend/src/components/RaceCard.module.css` — `.card:hover` rule already applies accent border + shadow.
- `apps/frontend/src/lib/queryClient.ts` — `QueryClient` with `staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`. TanStack Query v5 wired in app root.
- `packages/types/src/race-detail.dto.ts` — `RaceDetailDto extends RaceDto { results: RaceResultDto[] }`; `RaceResultDto.status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`; `finishTimeSeconds: number | null`. Import via `@ocr/types`.
- `apps/frontend/package.json` — `axios: ^1.17.0` installed. No `src/api/` directory yet. No frontend `.env` file.
- Backend on `http://localhost:3000`; `GET /races/:id` returns `RaceDetailDto`.
- Convention: named `const` arrow function, named export, CSS Modules, no inline styles, no Tailwind.

## Deliverables (definition of done)
1. `apps/frontend/src/api/http.ts` — module-scoped Axios instance with `baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`, exported as named `http`.
2. `apps/frontend/src/api/races.ts` — named export `getRace(id: string): Promise<RaceDetailDto>` calling `http.get<RaceDetailDto>(\`/races/${id}\`)` and returning `.data`.
3. `apps/frontend/.env` contains `VITE_API_URL=http://localhost:3000` (untracked; `.env` is gitignored).
4. `apps/frontend/src/components/RaceCardStats.tsx` — named `const` arrow component `RaceCardStats`, props exactly `{ raceId: string }`.
5. Component calls `useQuery({ queryKey: ['race', raceId], queryFn: () => getRace(raceId) })` with no `enabled` flag (fires on mount).
6. While `isPending`: renders three shimmer blocks using a locally-defined gradient + local `@keyframes` (NOT imported from `SkeletonCard`).
7. On `isError`: returns `null`.
8. On success, renders three stat items (value + label each):
   - **Finisher count**: `results.filter(r => r.status === 'FINISHED').length`; label `"finishers"`.
   - **Avg finish time**: average `finishTimeSeconds` over FINISHED results with non-null time, formatted `MM:SS` (or `H:MM:SS` if ≥ 3600s); `"—"` if no such results; label `"avg time"`.
   - **DNF rate**: `(DNF count / results.length * 100).toFixed(0) + '%'`; `"—"` if `results.length === 0`; label `"DNF rate"`.
9. Three private (non-exported) helpers in `RaceCardStats.tsx`:
   - `formatTime(seconds: number): string` — pads minutes/seconds; `H:MM:SS` when ≥ 3600s else `MM:SS`. Named constants: `SECONDS_PER_HOUR`, `SECONDS_PER_MINUTE`.
   - `calcAvgTime(results: RaceResultDto[]): string` — filters FINISHED + non-null `finishTimeSeconds`, averages, rounds to nearest second, calls `formatTime`; returns `'—'` if no qualifying results.
   - `calcDnfRate(results: RaceResultDto[]): string` — returns `'—'` if `results.length === 0`.
10. `apps/frontend/src/components/RaceCardStats.module.css` — stats flex row, stat value (bold, larger), stat label (small, muted), three loading shimmer blocks.
11. `RaceCard.tsx` updated: `useState(false)` hover state, `onMouseEnter`/`onMouseLeave` on root `<Link>`, renders `<RaceCardStats raceId={race.id} />` below the detail `<ul>` only when `hovered === true`. This is the only change to `RaceCard.tsx`.
12. `pnpm --filter frontend lint` passes; `pnpm --filter frontend build` succeeds.

## Rules that must hold
- No `any`; results typed as `RaceResultDto[]` imported from `@ocr/types`.
- Named exports for `http`, `getRace`, `RaceCardStats`. Format helpers are NOT exported.
- HTTP calls only via the `src/api/` Axios instance — never `fetch` or bare `axios` in components.
- CSS Modules only; no inline styles; no Tailwind.
- Magic numbers extracted to named constants (`SECONDS_PER_HOUR`, `SECONDS_PER_MINUTE`, `PERCENT = 100`).
- Do NOT import shimmer styles from `SkeletonCard.module.css` — replicate locally.
- Never commit `.env`.
- "Lazy-loaded on hover" = conditional mount via `useState`, NOT `React.lazy`/`Suspense`.

## Build steps
1. Create `apps/frontend/.env` with `VITE_API_URL=http://localhost:3000`.
2. Create `apps/frontend/src/api/http.ts` (Axios instance).
3. Create `apps/frontend/src/api/races.ts` (`getRace`).
4. Create `apps/frontend/src/components/RaceCardStats.module.css` (stats row, value, label, shimmer blocks + `@keyframes`).
5. Create `apps/frontend/src/components/RaceCardStats.tsx` (helpers, `useQuery`, three render branches).
6. Update `apps/frontend/src/components/RaceCard.tsx` (hover state + conditional `<RaceCardStats>`).
7. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
**Out of scope:** `/races` page grid (step 53); error UI/retry; prefetch-on-hover; aborting requests on un-hover; stats beyond the three specified.

**Files affected:** `src/api/http.ts` (new), `src/api/races.ts` (new), `.env` (new), `RaceCardStats.tsx` (new), `RaceCardStats.module.css` (new), `RaceCard.tsx` (modified).

**Edge cases:**
- `results.length === 0` → DNF rate `"—"`, finishers `0`, avg time `"—"`.
- All FINISHED results have `finishTimeSeconds === null` → avg time `"—"` (exclude null-time entries from both numerator and denominator).
- DNF rate denominator is total `results.length` (includes DNS/DSQ) — not starters-only.

**Gotchas:**
- `import.meta.env.VITE_API_URL` is `string | undefined`; the `?? fallback` narrows it to `string`. Only `VITE_`-prefixed vars are exposed by Vite.
- With `staleTime: 60_000`, repeated hovers within a minute do not refetch — intended.
- `import { type RaceResultDto } from '@ocr/types'` — use type-only import for `verbatimModuleSyntax`.

**Open questions (non-blocking; defaults assumed above):**
- Q1: Average rounding — assumed round-to-nearest second (`Math.round`).
- Q2: Label exact casing — `"finishers"`, `"avg time"`, `"DNF rate"` assumed; adjust if design specifies.