# Implementation Task: Delete button on RaceCard

## What to build
Add a delete control to the `RaceCard` component that, after a confirmation dialog, calls `DELETE /races/:id` and removes the card from the races list on success. The button is visible on card hover, must not trigger navigation to the race detail page, and shows an inline error within the card if the request fails.

## Current state
- `apps/frontend/src/components/RaceCard.tsx` — `RaceCard` renders a `<Link to={/races/:id}>` wrapping all content; tracks a local `hovered` boolean (`useState`) used to conditionally render `<RaceCardStats raceId={race.id} />`. Named export, arrow function.
- `apps/frontend/src/components/RaceCard.module.css` — defines `.card`, `.name`, `.details`, `.detail`. Uses tokens `--color-surface`, `--color-border`, `--color-accent`.
- `apps/frontend/src/components/RaceCardStats.tsx` — sibling component already rendered only on hover; reference for the hover pattern.
- `apps/frontend/src/api/races.ts` — exposes `getRaces(page, limit)` and `getRace(id)`. Uses the `http` Axios instance from `./http`. No delete function exists yet.
- `apps/frontend/src/api/http.ts` — `axios.create({ baseURL: VITE_API_URL ?? 'http://localhost:3000' })`.
- `apps/frontend/src/pages/RacesPage.tsx` — `useQuery({ queryKey: ['races'], queryFn: () => getRaces() })`, renders `data.data.map((race) => <RaceCard key={race.id} race={race} />)`. The cached value is a `PaginatedResponse<RaceDto>`.
- `packages/types/src/paginated.dto.ts` — `PaginatedResponse<T> = { data: T[]; total: number; page: number; limit: number }`.
- Backend `apps/backend/src/races/races.controller.ts` — `@Delete(':id')` returns **204 No Content** on success and **404 Not Found** if the race does not exist. Endpoint already implemented (step 68). ✅
- Stack: React 19, Vite, TypeScript, TanStack Query v5, Axios.

## Deliverables (definition of done)
1. A new API function `deleteRace(id: string): Promise<void>` is added to `apps/frontend/src/api/races.ts`, calling `http.delete('/races/${id}')` and resolving to `void` (ignore the empty 204 body). No `any` types.
2. `RaceCard` renders a delete button that is present in the DOM only while the card is hovered (same condition currently gating `RaceCardStats`).
3. Clicking the delete button does NOT navigate to `/races/:id` — navigation is prevented (the click handler stops propagation and prevents default before any other logic).
4. Clicking the delete button shows a native `window.confirm` dialog with a message naming the race (e.g. `Delete "${race.name}"? This cannot be undone.`). If the user cancels, no request is sent and nothing changes.
5. On confirm, a TanStack Query mutation (`useMutation`) calls `deleteRace(race.id)`.
6. On mutation success, the deleted race is removed from the `['races']` query cache via `queryClient.setQueryData<PaginatedResponse<RaceDto>>(['races'], ...)`: the matching item is filtered out of `data` AND `total` is decremented by 1. The card disappears without a full refetch. If the cached value is `undefined`, the updater returns it unchanged (no throw).
7. While the mutation is pending, the delete button is disabled and conveys an in-progress state (e.g. label/text change or `aria-busy`), preventing double submission.
8. On mutation error, an inline error message is rendered inside the card (not an alert, not navigation away). The error text is a fixed string (e.g. `Failed to delete race.`).
9. The delete button has an accessible name (visible text or `aria-label`) identifying it as deleting the race.
10. New CSS class(es) for the button and inline error are added to `RaceCard.module.css` using existing tokens (`--color-danger` for the destructive affordance, `--color-text-muted`/`--color-danger` for the error). No inline styles except CSS-custom-property values per project convention.
11. `pnpm --filter frontend lint` passes with no new warnings/errors.

## Rules that must hold
- HTTP calls only through the `api/` layer (`races.ts`) using the shared `http` Axios instance — no inline Axios/fetch in the component.
- Styles only via `RaceCard.module.css` (CSS Modules) — no inline style objects except CSS custom properties.
- No `any`; use the shared `PaginatedResponse<RaceDto>` and `RaceDto` types from `@ocr/types`.
- Named export for `RaceCard` and `deleteRace`; `const` arrow function for the component.
- No magic numbers — extract any literal (e.g. the decrement amount) as a named constant.
- One component per file — do not split into a new file unless adding the button requires it; extending `RaceCard` in place is expected.
- Backward compatible: `RaceCardProps` keeps `race: RaceDto` as its only required prop; do not require callers (`RacesPage`) to pass new props.
- The component must obtain `queryClient` via `useQueryClient()` — no prop drilling.

## Build steps
1. Add `deleteRace(id: string): Promise<void>` to `apps/frontend/src/api/races.ts`.
2. In `RaceCard.tsx`, import `useMutation` and `useQueryClient` from `@tanstack/react-query`, the `deleteRace` function, and `PaginatedResponse`/`RaceDto` types.
3. Inside `RaceCard`, set up `useQueryClient()` and a `useMutation` whose `mutationFn` is `() => deleteRace(race.id)`, with an `onSuccess` that updates the `['races']` cache per Deliverable 6.
4. Add the delete button inside the card, rendered under the existing `hovered` condition. Give it an `onClick` that first calls `e.preventDefault()` and `e.stopPropagation()`, then runs `window.confirm(...)`, and only on confirm calls `mutation.mutate()`.
5. Bind `disabled` and the pending label to `mutation.isPending`.
6. Render the inline error element when `mutation.isError` is true.
7. Add `.deleteButton` (and pending/disabled styling) and `.deleteError` classes to `RaceCard.module.css` using existing tokens; position the button so it does not overlap the card content (e.g. top-right corner or below details).
8. Run `pnpm --filter frontend lint` and fix any issues.

## Notes for the implementer
**Out of scope:**
- Custom modal/confirmation component — `window.confirm` is the agreed MVP mechanism.
- Undo / restore after delete.
- Pagination correctness across pages (the cache update only touches the currently cached `['races']` page; multi-page reconciliation is deferred).
- Optimistic removal before the server confirms — remove only in `onSuccess`.
- Backend changes — the `DELETE /races/:id` endpoint already exists. ✅

**Files likely affected:**
- `apps/frontend/src/api/races.ts` (add `deleteRace`)
- `apps/frontend/src/components/RaceCard.tsx` (add button + mutation)
- `apps/frontend/src/components/RaceCard.module.css` (button + error styles)

**Edge cases / gotchas:**
- The card root is a `<Link>`; placing an interactive `<button>` inside an `<a>` is valid HTML, but the click MUST stop propagation AND prevent default, otherwise React Router navigates on the same click. Verify both pointer and keyboard (Enter/Space) activation do not navigate.
- 204 No Content has an empty body — `deleteRace` must not try to read/parse `res.data` into a typed value; resolve `void`.
- A 404 (race already deleted elsewhere) will surface as a mutation error; the inline error covers this.
- `setQueryData` updater receives `PaginatedResponse<RaceDto> | undefined`; guard the `undefined` case.
- Hover state: because the button only exists on hover, ensure that clicking it (which may move focus / remove the card) does not leave the mutation orphaned — the mutation lives on `RaceCard`, which unmounts when the card is removed; that is fine for `onSuccess` since the cache update happens synchronously in the callback.

**Open questions (non-blocking):**
1. Should a successful delete also invalidate the per-race `['race', id]` query cache (used by `RaceCardStats`)? Recommended but not required for the card to disappear. Implementer's discretion.
2. Exact placement/icon of the button (top-right vs. footer) is a design choice left open, constrained only by "must not overlap content and must be reachable on hover."