# Implementation Task: SkeletonChart Component

## What to build
A `SkeletonChart` component that renders a CSS-only loading placeholder mimicking a horizontal bar chart (y-axis obstacle labels on the left, bars on the right, x-axis strip at the bottom, plus a title block on top). It serves as the loading fallback for the Recharts bar charts in steps 55 (`ObstacleSplitChart`) and 56 (`PenaltyRateChart`).

## Current state
- No `SkeletonChart` files exist yet.
- `apps/frontend/src/components/SkeletonCard.module.css` — established shimmer pattern: `.shimmer` (gradient `#e5e7eb`/`#f3f4f6`, `background-size: 200% 100%`, `animation: shimmer 1.4s ease-in-out infinite`, `border-radius: 4px`) + local `@keyframes shimmer`. Blocks combine a dimension class + `.shimmer` via template literal.
- `apps/frontend/src/components/SkeletonTable.tsx` — precedent for optional count prop with `DEFAULT_ROWS = 5` constant and `Array.from({ length: n }, (_, i) => …)`. Named export, CSS Modules only.
- `apps/frontend/src/index.css` — `:root { --color-accent: #6366f1; --color-border: #e5e7eb; }`, global `box-sizing: border-box`.
- Component convention: named `const` arrow function, named export, one component per file, CSS Modules, no inline styles, no Tailwind.
- React 19.2.6, TypeScript ~6.0.2, Vite 8.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/SkeletonChart.tsx` exporting a named `const SkeletonChart` arrow function.
2. New file `apps/frontend/src/components/SkeletonChart.module.css` — the only stylesheet for this component.
3. Component accepts one optional prop: `bars?: number`. Module-level constant `DEFAULT_BARS = 8` is used when `bars` is undefined. No `any` types.
4. Renders a shimmer title block at the top: ~40% width, ~16px tall.
5. Below the title, a chart-area row (`display: flex; flex-direction: row`) containing a left column and a right column.
6. Left column: `bars ?? DEFAULT_BARS` shimmer label blocks stacked vertically (`gap: 12px`), each ~80px wide × ~14px tall.
7. Right column: same count of shimmer bar blocks stacked vertically (`gap: 12px`), each 100% wide × ~14px tall; followed by one shimmer x-axis strip (100% wide × ~10px tall) below all bars.
8. Both columns use the same `gap: 12px` and the same row height (~14px) so label and bar rows stay horizontally aligned.
9. No fixed `height` on the root — height grows naturally from bar count.
10. Shimmer fills are hardcoded `#e5e7eb`/`#f3f4f6`; `@keyframes shimmer` defined locally in `SkeletonChart.module.css`.
11. No outer border or background on the root element.
12. `pnpm --filter frontend lint` passes; no `any` types; no TypeScript errors.

## Rules that must hold
- No `any` types; prop type is `{ bars?: number }`.
- No magic numbers in component body — counts derive from `DEFAULT_BARS` / `bars` prop only.
- CSS Modules only — no inline styles, no Tailwind.
- Do NOT render SVG or import Recharts — pure CSS/markup.
- Shimmer animation identical to `SkeletonCard`/`SkeletonTable` (same gradient, `1.4s ease-in-out`, `4px` radius).
- Named export only; no outer border/background on root.

## Build steps
1. Create `SkeletonChart.module.css`: define `.shimmer` + `@keyframes shimmer` (established pattern). Add layout classes: `.root` (flex column, gap between title and chart area), `.title` (~40% width, 16px height), `.chartArea` (flex row), `.leftCol` + `.rightCol` (each flex column, `gap: 12px`), `.label` (80px wide, 14px height), `.bar` (100% wide, 14px height), `.axis` (100% wide, 10px height).
2. Create `SkeletonChart.tsx`: declare `DEFAULT_BARS = 8`, render `.root` containing the `.title` shimmer, then `.chartArea` with `.leftCol` (mapped label shimmer blocks) and `.rightCol` (mapped bar shimmer blocks + one `.axis` shimmer strip).
3. Combine classes via template literal: e.g. `` `${styles.label} ${styles.shimmer}` ``.
4. Run `pnpm --filter frontend lint`; fix any issues.

## Notes for the implementer
**Out of scope:** actual chart rendering, Recharts, responsive breakpoints, dark mode, wiring into steps 55/56.

**Files affected:** `SkeletonChart.tsx` (new), `SkeletonChart.module.css` (new). No existing files modified.

**Edge cases:** `bars={0}` renders title + empty columns + x-axis strip — no special-casing needed; `Array.from({ length: 0 })` yields `[]` naturally.

**Alignment gotcha:** Left and right columns must use the same `gap` (12px) AND matching row heights (14px) — if they drift, label and bar rows will misalign. Verify both columns have identical per-row height.

**Open questions (non-blocking):**
- Q1: Title width (~40%) and pixel dimensions are approximate — adjust if design specifies otherwise.
- Q2: Chart area left-column width is not constrained by a fixed pixel value here; ~80px labels leave the right column to take remaining space via `flex: 1` if needed.