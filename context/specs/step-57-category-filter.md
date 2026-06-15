# Implementation Task: CategoryFilter

## What to build
A presentational `CategoryFilter` dropdown component that lets the user pick a single athlete category (or "All") from the categories present in a race's results. It is a controlled component: it renders the available options and reports the selected value to its parent; it does not fetch data or filter results itself.

## Current state
- `apps/frontend/src/components/` — existing dashboard components follow a consistent pattern: named `const` arrow-function export, co-located `.module.css`, `Props` interface exported (see `ObstacleSplitChart.tsx`, `PenaltyRateChart.tsx`).
- No `CategoryFilter.tsx` or `CategoryFilter.module.css` exists yet — this is net-new.
- No native `<select>` or dropdown component exists anywhere in `components/` to reuse — this is the first one.
- `packages/types/src/race-detail.dto.ts` — `RaceResultDto` has `athlete: AthleteDto`; `RaceResultDto.status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`.
- `packages/types/src/athlete.dto.ts` — `AthleteDto.category: string` (the field to filter on). Category is a free-form string; known badge variants imply values like `sprint`, `super`, `deka`, `open`, but the DTO does not constrain them.
- `apps/frontend/src/api/races.ts` — `getRace(id)` returns `RaceDetailDto` with `results: RaceResultDto[]`. No category endpoint exists; categories must be derived from `results`.
- `apps/frontend/src/index.css` — CSS custom-property tokens are defined: `--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`. Use these, not hardcoded hex.
- Stack: React 19, Vite, TypeScript (no `any`), CSS Modules. Styling rule: no inline styles; one component per file; named exports for non-page components.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/CategoryFilter.tsx` exporting a named `const CategoryFilter` arrow-function component.
2. An exported `CategoryFilterProps` interface with exactly these props:
   - `categories: string[]` — the list of selectable category values (parent-provided, deduped).
   - `value: string | null` — the currently selected category; `null` means "All categories".
   - `onChange: (value: string | null) => void` — called with the new selection (`null` when "All" is chosen).
3. The component renders a single native `<select>` (or equivalent) containing one "All" option plus one option per entry in `categories`, in the order received.
4. Selecting "All" calls `onChange(null)`; selecting any category calls `onChange(<that category string>)`.
5. The `<select>` reflects `value`: when `value` is `null` the "All" option is selected; otherwise the matching option is selected (controlled, not uncontrolled).
6. The `<select>` has an associated, programmatically-linked accessible label (e.g. `<label htmlFor>` + `id`, or `aria-label`). A visible label text "Category" is rendered.
7. When `categories` is empty, the component still renders and shows only the "All" option (no crash).
8. New file `apps/frontend/src/components/CategoryFilter.module.css` providing styles for wrapper, label, and select, using existing CSS tokens (no hardcoded colors, no magic hex).
9. TypeScript compiles with no `any`; `pnpm --filter frontend lint` passes for the new files.

## Rules that must hold
- No `any`; use the shared/inline types as specified. No magic numbers — extract named constants if any are needed.
- No inline styles — all styling via `CategoryFilter.module.css`.
- No hardcoded colors — use `var(--color-*)` tokens from `index.css`.
- Named export (not default) — this is a reusable component, not a page.
- The component is presentational/controlled only: it must NOT call `getRace`, TanStack Query, or Axios, and must NOT itself filter or own the results array.
- One component per file.
- Do not modify `packages/types` — `AthleteDto.category` is already `string`.

## Build steps
1. Create `CategoryFilter.module.css` with `.wrapper`, `.label`, and `.select` classes using the existing tokens.
2. Create `CategoryFilter.tsx`: define and export `CategoryFilterProps` per Deliverable 2.
3. Define a named constant for the "All" option (e.g. label text `'All categories'`) — do not hardcode the string inline twice.
4. Render `<label>` + `<select>` linked by `htmlFor`/`id`; render the "All" option first, then map `categories` to `<option>` elements keyed by the category string.
5. Implement the change handler: empty/"All" sentinel value → `onChange(null)`; otherwise → `onChange(selectedValue)`.
6. Drive the `<select value=...>` from the `value` prop (mapping `null` → the "All" sentinel).
7. Run `pnpm --filter frontend lint` and confirm it passes.

## Notes for the implementer
**Out of scope (deferred to Step 58 `AthleteLeaderboard` / Step 59 dashboard page):**
- Deriving the unique category list from `RaceResultDto[]` — the parent does this and passes `categories` in.
- Actually filtering the leaderboard rows by the selected category.
- Persisting the selection (URL query param, localStorage).
- Data fetching of any kind.

**Edge cases to handle now:**
- Empty `categories` array → render with only the "All" option.
- Duplicate categories are the parent's responsibility; this component renders `categories` as-is (if duplicates arrive, `key` collisions are possible — assume parent dedupes).

**Edge cases deferred:** sorting of category order (render in received order), counts per category next to each option, multi-select.

**Gotchas:**
- Native `<select>` cannot hold a real `null` value attribute; use a sentinel string (e.g. `''` or `'__all__'`) internally and map to/from `null` at the boundary so the public API stays `string | null`.
- Match the existing component idiom in `ObstacleSplitChart.tsx`/`PenaltyRateChart.tsx` (exported `Props` interface, `const` arrow component, co-located CSS module).

**Open questions (non-blocking — defaults chosen above):**
- Q1: Should `CategoryFilter` derive categories from `results: RaceResultDto[]` itself (more self-contained), or receive a pre-computed `categories: string[]` (more reusable/testable)? This spec assumes the latter (`categories: string[]`). Confirm before Step 58 wiring; if it must own derivation, swap the prop to `results` and add a `useMemo`-based dedupe + the "filter to FINISHED only?" decision.
- Q2: Should the "All" sentinel be the empty string or an explicit token like `'__all__'`? Either satisfies the spec; pick one and keep it internal.