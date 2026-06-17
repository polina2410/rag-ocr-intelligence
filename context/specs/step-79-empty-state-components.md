# Implementation Task: Empty State Components (Step 79)

## What to build
A reusable `EmptyState` component (with CSS Module) for the frontend, applied to the three places that currently show bare, unstyled empty/no-data messages: the races list, the athlete leaderboard (when filtered results are empty), and the Ask chat initial state. Error states are out of scope.

## Current state
- `apps/frontend/src/pages/RacesPage.tsx` — renders unstyled `<p>No races found.</p>` (line 33) when `data.data.length === 0`; error branch is out of scope
- `apps/frontend/src/components/AthleteLeaderboard.tsx` — lines 145–150 render `<tr><td className={styles.emptyCell} colSpan={COLUMNS.length}>No results.</td></tr>` when filtered `rows.length === 0`; `.emptyCell` applies `--color-text-muted` and centered text
- `apps/frontend/src/pages/AskPage.tsx` — `messages` starts as `[]`; `ChatHistory` renders only the scroll container when empty; no prompt shown to a first-time user
- No `EmptyState` component exists under `apps/frontend/src/components/`
- Design tokens in `apps/frontend/src/index.css`: `--color-accent`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-surface`, `--font-size-xl`, `--font-size-base`, `--font-size-sm`

## Deliverables (definition of done)
1. New `apps/frontend/src/components/EmptyState.tsx` — named export `const EmptyState`, typed `EmptyStateProps { title: string; description?: string; icon?: ReactNode; action?: ReactNode }`. One component per file.
2. New `apps/frontend/src/components/EmptyState.module.css` — all colors and font-sizes reference `var(--token)` only; no hardcoded hex or font-size literals.
3. `EmptyState` renders: `icon` (when provided) above `title`, `title` as a heading, `description` as muted text (when provided), `action` below (when provided). Omitted optional props produce no empty wrapper element.
4. `RacesPage.tsx` empty branch (`data.data.length === 0`) replaced with `<EmptyState title="No races found" description="Upload a CSV to get started." />`.
5. `AskPage.tsx`: when `messages.length === 0`, render `<EmptyState title="Ask anything about the races" description="..." />` inside the `styles.history` area; replaced by `<ChatHistory>` once messages exist. Not shown while streaming.
6. `AthleteLeaderboard.tsx` empty branch: keep the existing `<td colSpan={COLUMNS.length}>` but replace the text with a lightweight `<EmptyState title="No results" />` inside it (table markup stays valid — no `<div>` as direct `<tbody>` child).
7. `pnpm --filter frontend lint` passes.
8. `pnpm --filter frontend build` succeeds.

## Rules that must hold
- Named export, `const` arrow component, one component per file
- Styles only via `EmptyState.module.css` — no inline styles
- All colors and font-sizes in `.module.css` via `var(--token)` — no hardcoded hex or `rem`/`px` font-size literals
- `icon` and `action` typed as `ReactNode` — no `any`
- Backward-compatible: error and loading branches in all three files unchanged
- `EmptyState` inside `<td>` is the only valid table-body empty-state position (do NOT render a `<div>` as a direct `<tbody>` child)
- AskPage: `ChatInput` and the error `role="alert"` block must remain visible when the empty state is shown; do not show empty state while streaming (`isStreaming === true`)

## Build steps
1. Create `EmptyState.module.css`: flex column container (centered, `gap`, `padding`), `.title` uses `var(--font-size-xl)` + `var(--color-text)`, `.description` uses `var(--font-size-sm)` + `var(--color-text-muted)`, `.icon` and `.action` wrapper divs.
2. Create `EmptyState.tsx`: import `type ReactNode` from `react`; define `EmptyStateProps`; render conditional `icon`/`description`/`action` sections; use `<p>` for title (heading level is caller-determined by surrounding context — a configurable heading prop is optional).
3. Update `RacesPage.tsx`: import `EmptyState`; replace `<p>No races found.</p>` with `<EmptyState title="No races found" description="Upload a CSV to get started." />`.
4. Update `AskPage.tsx`: import `EmptyState`; branch on `messages.length === 0 && !isStreaming` to show `<EmptyState title="Ask anything about the races" description="Your answer will stream in below." />` inside the history area.
5. Update `AthleteLeaderboard.tsx`: replace the bare `No results.` text with `<EmptyState title="No results" />` inside the existing `<td colSpan={COLUMNS.length}>`.
6. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
- **Out of scope:** error states, backend changes, new design tokens, illustrations/asset files (icon is an optional caller-provided `ReactNode`). Steps 80 and 81 are separate.
- **Table validity:** `AthleteLeaderboard`'s empty cell uses `<td>` wrapping `EmptyState`'s `<div>` — this is valid HTML; avoid making `EmptyState` render a `<tr>` or `<td>` itself.
- **AskPage:** `messages.length === 0 && !isStreaming` guards correctly — do not use just `messages.length === 0` because the user's first message is added to state before streaming starts, so the empty state disappears immediately on submit.
- **Heading level:** `EmptyState`'s title can default to a styled `<p>` or `<span>` rather than a heading to avoid hierarchy conflicts; each page already has its own `<h1>` or `RaceHeader`. Alternatively, accept an optional `as?: 'h2' | 'h3' | 'p'` prop — implementer's call.
- **`.emptyCell`** in `AthleteLeaderboard.module.css` can remain; `EmptyState` renders inside the same `<td>`, so both styles are composable.
