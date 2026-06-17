# Current Feature: CursorHint Tooltip System

## Status
In Progress

## Goals

- NEW `apps/frontend/src/components/CursorHint.tsx` — named export, no props; reads `{ x, y, hint }` from `useCursor()`
- `<AnimatePresence>` wraps a `motion.div` rendered only when `hint !== null`
- `motion.div`: `style={{ left: x + HINT_OFFSET_X, top: y + HINT_OFFSET_Y }}`, text `{hint}`
- Animation: `initial={{ opacity: 0, y: 4 }}` → `animate={{ opacity: 1, y: 0 }}` → `exit={{ opacity: 0, y: 4 }}`, `transition={{ duration: 0.15 }}`
- Named constants: `HINT_OFFSET_X = 16`, `HINT_OFFSET_Y = 8`, `HINT_TRANSITION_DURATION = 0.15`
- NEW `apps/frontend/src/components/CursorHint.module.css` — `.hint`: `position: fixed`, `top/left: 0`, surface bg, border, `border-radius: 4px`, `padding: 4px 8px`, `var(--font-size-xs)`, `var(--color-text)`, `white-space: nowrap`, `pointer-events: none`, `z-index: 9998`
- EDIT `RootLayout.tsx` — import `CursorHint`; render `<CursorHint />` immediately after `<CursorDot />`
- `pnpm --filter frontend lint` passes; no `any`

## Notes

- Do NOT modify `CursorContext.tsx`, `useCursor.ts`, or `CursorDot.tsx`
- `AnimatePresence` must directly wrap the conditional `motion.div` — no static wrapper between them
- `left`/`top` position via `style` only (not animated) — same pattern as `CursorDot`
- `z-index: 9998` — one below `CursorDot`'s 9999
- Hint text changing between non-null values: no key change needed — same `motion.div` updates continuously
- Spec: `context/specs/step-73-cursor-hint.md`

## History

<!-- Completed features are tracked in context/features-history.md -->
