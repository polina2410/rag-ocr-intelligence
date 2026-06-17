# Current Feature: CursorDot Component

## Status
In Progress

## Goals

- NEW `apps/frontend/src/components/CursorDot.tsx` — named export, no props, reads `{ x, y, mode }` from `useCursor()`
- NEW `apps/frontend/src/components/CursorDot.module.css` — `.dot`: `position: fixed`, `top: 0`, `left: 0`, `transform: translate(-50%, -50%)`, `pointer-events: none`, `border-style: solid`, `z-index: 9999`
- Framer Motion `motion.div`: position via `style={{ left: x, top: y }}` (no lag); shape via `animate={SHAPES[mode]}`
- Shape map (`Record<CursorMode, ...>`): `default/hover` → 10px filled circle (`--color-accent`); `pointer` → 20px ring (2px border, transparent bg)
- Shape transition: `duration: 0.15, ease: 'easeOut'`
- Named constants: `DOT_SIZE = 10`, `RING_SIZE = 20`, `RING_BORDER = 2`, `TRANSITION_DURATION = 0.15`, `FULL_RADIUS = 9999`
- EDIT `index.css` — add `cursor: none` to `body`
- EDIT `RootLayout.tsx` — mount `<CursorDot />` as first child inside `<CursorProvider>`
- `pnpm --filter frontend lint` passes; no `any`

## Notes

- Colors in `animate` use `'var(--color-accent)'` — never hardcoded hex
- The ONLY permitted inline styles are `left`/`top` position values
- `border-style: solid` in CSS is required so Framer Motion's `borderWidth: 2` renders on `'pointer'` mode
- `z-index` lives in CSS Module only — no TS const for it
- Initial render at `0,0` until first `mousemove` — acceptable for MVP
- Do NOT modify `CursorContext.tsx` or `useCursor.ts`
- Spec: `context/specs/step-72-cursor-dot.md`

## History

<!-- Completed features are tracked in context/features-history.md -->
