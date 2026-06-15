# Implementation Task: SkeletonTable Component

## What to build
A loading-placeholder component that renders a real `<table>` with shimmer blocks in place of header and body cell content. It serves as the loading fallback for the step-58 `AthleteLeaderboard` (columns: position, athlete name, category badge, finish time, overall place, category place).

## Current state
- `apps/frontend/src/components/SkeletonCard.tsx` — reference component: named `const` arrow function, named export, zero props, CSS Modules, no inline styles.
- `apps/frontend/src/components/SkeletonCard.module.css` — established shimmer pattern (`.shimmer` + `@keyframes shimmer`, 1.4s ease-in-out infinite, `#e5e7eb` / `#f3f4f6`, `border-radius: 4px`). Blocks combine a dimension class + `.shimmer` via template literal.
- `apps/frontend/src/index.css` — `:root { --color-accent: #6366f1; --color-border: #e5e7eb; }`, global `box-sizing: border-box`.
- No `SkeletonTable` exists yet.
- React 19.2.6, TypeScript ~6.0.2, Vite 8. CSS Modules only, no Tailwind.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/SkeletonTable.tsx` exporting a named `const` arrow component `SkeletonTable`.
2. Component accepts one optional prop: `rows?: number`, defaulting to a named constant `DEFAULT_ROWS = 5`. No `any` types.
3. Component renders `<table>` → `<thead>` (one `<tr>` with 6 `<th>` cells) → `<tbody>` (`rows` `<tr>` elements each with 6 `<td>` cells).
4. Each `<th>` / `<td>` contains a shimmer block (not full cell width — per-column fixed widths per deliverable 6).
5. Header shimmer blocks are ~12px tall; body shimmer blocks are ~14px tall.
6. Six column widths, in order: position ~24px, name ~140px, category ~64px, finish-time ~72px, overall place ~32px, category place ~32px.
7. New file `apps/frontend/src/components/SkeletonTable.module.css` with `.shimmer` + local `@keyframes shimmer` (same pattern as `SkeletonCard` — defined again locally, NOT imported across modules), `.table`, cell styles, and six per-column width classes.
8. Table styling: `width: 100%`, `border-collapse: collapse`. Each `<td>`/`<th>` has `padding: 12px 8px` and `border-bottom: 1px solid var(--color-border)`. No outer border or background on `<table>` itself.
9. Mapped rows/cells use index-based `key` (acceptable — list is static).
10. `pnpm --filter frontend lint` passes; `<SkeletonTable />` and `<SkeletonTable rows={8} />` both render without errors.

## Rules that must hold
- Named `const` arrow function, named export, one component per file, no `any`.
- No inline styles — CSS Modules only.
- Row separator uses `var(--color-border)` — do not hardcode the border hex.
- `@keyframes shimmer` defined locally in `SkeletonTable.module.css` — do NOT import `SkeletonCard.module.css`.
- Named constant for default row count (`DEFAULT_ROWS = 5`) — no magic number in TSX.
- `rows={0}` renders an empty `<tbody>`; no guard needed for negatives.

## Build steps
1. Create `SkeletonTable.module.css`: copy shimmer class and keyframes from `SkeletonCard` pattern. Add `.table` (`width: 100%`, `border-collapse: collapse`), `.cell` (`padding: 12px 8px`, `border-bottom: 1px solid var(--color-border)`, `vertical-align: middle`), `.headerShimmer` (height ~12px), `.bodyShimmer` (height ~14px), and six width classes: `.colPosition` (24px), `.colName` (140px), `.colCategory` (64px), `.colTime` (72px), `.colPlace` (32px).
2. Create `SkeletonTable.tsx`: define `const DEFAULT_ROWS = 5`, props type `{ rows?: number }`, render `<table className={styles.table}>` with `<thead>` (6 header cells) and `<tbody>` (map `Array.from({ length: rows ?? DEFAULT_ROWS })`).
3. Combine column + shimmer classes: e.g. `` `${styles.colName} ${styles.bodyShimmer} ${styles.shimmer}` ``.
4. Run `pnpm --filter frontend lint`; fix any issues.

## Notes for the implementer
**Out of scope:** AthleteLeaderboard data/sorting (step 58), configurable columns, responsive horizontal scroll (deferred to step 59 container), dark mode, `prefers-reduced-motion`.

**Files affected:** `SkeletonTable.tsx` (new), `SkeletonTable.module.css` (new). No existing files modified.

**Gotchas:**
- `border-collapse: collapse` is required so per-cell `border-bottom` reads as clean row separators without doubled lines.
- `.colPlace` covers both overall and category place columns (same 32px width).
- Column order in both `<thead>` and `<tbody>` must match: position, name, category, finish-time, overall place, category place.

**Open questions (non-blocking):**
- Q1: Horizontal scroll wrapper for narrow viewports — deferred to step-59 leaderboard container.
- Q2: Header vs. body shimmer differentiation is height-only (12px vs. 14px, same gradient). Confirm if a more muted header style is desired.