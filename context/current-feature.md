# Current Feature: Delete Button on RaceCard

## Status
In Progress

## Goals

- NEW `deleteRace(id: string): Promise<void>` in `apps/frontend/src/api/races.ts` — calls `http.delete('/races/${id}')`, resolves `void`
- `RaceCard` renders a delete button only while hovered (same condition as `RaceCardStats`)
- Button click calls `e.preventDefault()` + `e.stopPropagation()` before any logic — no navigation
- `window.confirm` dialog names the race; cancelling sends no request
- On confirm, `useMutation` calls `deleteRace(race.id)`
- On success: `queryClient.setQueryData<PaginatedResponse<RaceDto>>(['races'], ...)` filters out the deleted race from `data` and decrements `total` by 1 — no refetch; guard `undefined` cache value
- While pending: button is `disabled` + conveys in-progress state (label change or `aria-busy`)
- On error: inline error message rendered inside card (`Failed to delete race.`); no alert/navigation
- Button has accessible name (visible text or `aria-label`)
- `.deleteButton` and `.deleteError` CSS classes added to `RaceCard.module.css` using `--color-danger` token
- `pnpm --filter frontend lint` passes

## Notes

- Card root is a `<Link>` — placing `<button>` inside `<a>` is valid HTML but click MUST stop propagation AND prevent default or React Router navigates
- 204 No Content response: `deleteRace` must not parse `res.data` — return `void`
- `setQueryData` updater receives `PaginatedResponse<RaceDto> | undefined` — guard the `undefined` case
- `queryClient` obtained via `useQueryClient()` inside `RaceCard` — no prop drilling
- `RaceCardProps` stays `{ race: RaceDto }` — no new props required from callers
- Out of scope: custom modal, undo, optimistic removal, multi-page pagination reconciliation
- Spec: `context/specs/step-69-delete-racecard-button.md`

## History

<!-- Completed features are tracked in context/features-history.md -->