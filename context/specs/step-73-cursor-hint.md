# Implementation Task: data-cursor-hint Tooltip System (CursorHint)

## What to build
A `CursorHint` component that renders a small text tooltip near the cursor whenever the hovered element (or an ancestor) carries a `data-cursor-hint` attribute. It reads the already-live `hint` value from `useCursor()`, positions itself at an offset from the cursor, and fades in/out via Framer Motion `AnimatePresence`.

## Current state
- ✅ `apps/frontend/src/context/CursorContext.tsx` (step 70) — already reads `data-cursor-hint` via `target.closest('[data-cursor-hint]')?.getAttribute(...)` on every `mousemove` and exposes `hint: string | null`. No changes needed.
- ✅ `apps/frontend/src/hooks/useCursor.ts` (step 71) — returns `{ x, y, hint, mode }`. No changes needed.
- ✅ `apps/frontend/src/components/CursorDot.tsx` (step 72) — reference for positioning pattern: `style={{ left: x, top: y }}`, `motion.div`, `TRANSITION_DURATION = 0.15`. No changes needed.
- `apps/frontend/src/components/RootLayout.tsx` — mounts `<CursorDot />` first child of `<CursorProvider>`; `<CursorHint />` goes immediately after it.
- `framer-motion: ^12.40.0` installed — `AnimatePresence` + `motion.div` available.
- CSS tokens: `--color-surface`, `--color-border`, `--color-text`, `--font-size-xs`.

## Deliverables (definition of done)
1. NEW `apps/frontend/src/components/CursorHint.tsx`:
   - Named export `const CursorHint`, no props, arrow function.
   - Reads `{ x, y, hint }` from `useCursor()`.
   - Wraps render in `<AnimatePresence>`; renders `motion.div` only when `hint` is non-null.
   - `motion.div`: `className={styles.hint}`, `style={{ left: x + HINT_OFFSET_X, top: y + HINT_OFFSET_Y }}`, text content `{hint}`.
   - Animation: `initial={{ opacity: 0, y: 4 }}`, `animate={{ opacity: 1, y: 0 }}`, `exit={{ opacity: 0, y: 4 }}`, `transition={{ duration: HINT_TRANSITION_DURATION }}`.
   - Named constants: `HINT_OFFSET_X = 16`, `HINT_OFFSET_Y = 8`, `HINT_TRANSITION_DURATION = 0.15`. No magic numbers inline.
2. NEW `apps/frontend/src/components/CursorHint.module.css` with `.hint`:
   - `position: fixed; top: 0; left: 0;`
   - `background: var(--color-surface);`
   - `border: 1px solid var(--color-border);`
   - `border-radius: 4px;`
   - `padding: 4px 8px;`
   - `font-size: var(--font-size-xs);`
   - `color: var(--color-text);`
   - `white-space: nowrap;`
   - `pointer-events: none;`
   - `z-index: 9998;`
3. EDIT `RootLayout.tsx`: import `CursorHint`; render `<CursorHint />` immediately after `<CursorDot />`.
4. `pnpm --filter frontend lint` passes with no new errors.

## Rules that must hold
- Named export only; no default export; `const` arrow function; one component per file.
- No `any`.
- Inline styles only for `left`/`top` position — all other values in CSS Module using `var(--token)`.
- `z-index: 9998` (one below `CursorDot`'s 9999).
- `pointer-events: none` — tooltip must never block interaction.
- Do NOT modify `CursorContext.tsx`, `useCursor.ts`, or `CursorDot.tsx`.
- `AnimatePresence` must directly wrap the conditionally-rendered `motion.div` — no static wrapper between them.

## Build steps
1. Create `CursorHint.module.css` with `.hint` class (deliverable 2).
2. Create `CursorHint.tsx`: import `motion` and `AnimatePresence` from `framer-motion`, `useCursor`, and the CSS Module; define three named constants; implement the component (deliverable 1).
3. Edit `RootLayout.tsx`: import `CursorHint`; add `<CursorHint />` after `<CursorDot />`.
4. Run `pnpm --filter frontend lint` and fix any errors.

## Notes for the implementer
**Usage (consumer side, for manual verification):**
```tsx
<button data-cursor-hint="Click to submit">Submit</button>
<a href="/races" data-cursor-hint="View all races">Races</a>
```

**Out of scope:** viewport edge/collision detection, multi-line hints, rich content, touch devices.

**Gotchas:**
- `hint === null` → nothing rendered; `AnimatePresence` fires the exit animation on transition to null.
- Hint text changing between two non-null values: the same `motion.div` updates text and position continuously — no key change needed (avoids flicker).
- `framer-motion` v12: `AnimatePresence` must directly wrap the conditional element for `exit` to fire.
- Position (`left`/`top`) tracks the cursor every move via `style` — intentionally not animated, same as `CursorDot`.
