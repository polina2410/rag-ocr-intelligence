# Implementation Task: CursorDot Component

## What to build
A `CursorDot` React component that renders a custom cursor following the mouse via `position: fixed`, sourcing position and mode from `useCursor()`. The dot stays glued to the cursor (no positional lag) while smoothly animating its shape (size, border-radius, background, border) when `mode` changes. It replaces the native OS cursor across all routes.

## Current state
- `apps/frontend/src/context/CursorContext.tsx` ✅ — exports `CursorMode = 'default' | 'hover' | 'pointer'`, `CursorContextValue { x, y, hint, mode }`, `CursorContext`, and `CursorProvider`. `mode` is auto-detected: interactive elements → `'pointer'`, else `'default'`; `'hover'` is reserved/never emitted yet.
- `apps/frontend/src/hooks/useCursor.ts` ✅ — `useCursor(): CursorContextValue`.
- `apps/frontend/src/components/RootLayout.tsx` — wraps app in `<CursorProvider>`; `<Navbar />` is the first child inside it.
- `apps/frontend/src/index.css` — has `:root` tokens (incl. `--color-accent: #6366f1`) and a `body { margin: 0; font-family: ... }` block.
- `framer-motion: ^12.40.0` — installed.
- Component files: `apps/frontend/src/components/CursorDot.tsx` and `CursorDot.module.css` (both new).

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/CursorDot.tsx` exporting a named `const` arrow component `CursorDot` that takes **no props**.
2. New file `apps/frontend/src/components/CursorDot.module.css` containing the dot's static styles.
3. `CursorDot` reads `{ x, y, mode }` from `useCursor()` (no prop drilling).
4. The dot is a Framer Motion `motion.div` with `className` from the CSS Module.
5. Position applied via inline `style={{ left: x, top: y }}` only — NOT via Framer Motion `animate`/spring. No positional lag.
6. The CSS Module `.dot` class sets: `position: fixed`, `top: 0`, `left: 0`, `transform: translate(-50%, -50%)`, `pointer-events: none`, `border-style: solid`, `z-index: 9999`.
7. Shape per mode via Framer Motion `animate` prop (keyed `Record<CursorMode, ...>`):
   - `'default'` and `'hover'`: `width: 10`, `height: 10`, `borderRadius: 9999`, `backgroundColor: 'var(--color-accent)'`, `borderWidth: 0`, `opacity: 1`
   - `'pointer'`: `width: 20`, `height: 20`, `borderRadius: 9999`, `backgroundColor: 'transparent'`, `borderWidth: 2`, `borderColor: 'var(--color-accent)'`, `opacity: 1`
8. Shape transition: `transition={{ duration: 0.15, ease: 'easeOut' }}`.
9. Dimensional literals extracted as named `const`s at the top of `CursorDot.tsx`: `DOT_SIZE = 10`, `RING_SIZE = 20`, `RING_BORDER = 2`, `TRANSITION_DURATION = 0.15`, `FULL_RADIUS = 9999`. Z-index lives in the CSS Module only (no TS const needed).
10. `apps/frontend/src/index.css` `body` selector gains `cursor: none;`.
11. `CursorDot` mounted in `RootLayout.tsx` as the **first child inside `<CursorProvider>`**, before `<Navbar />`.
12. `pnpm --filter frontend lint` passes; no `any` types.

## Rules that must hold
- Named export, `const` arrow function, one component per file.
- CSS Modules for static styles — the ONLY inline styles are `left`/`top` pixel values.
- Colors in `animate` use CSS custom properties (`'var(--color-accent)'`), never hardcoded hex.
- No hardcoded color or font-size literals in `CursorDot.module.css` — use `var(--token)`.
- No magic numbers — sizes, border width, and transition duration as named constants.
- No `any`. Type the mode→shape lookup keyed by `CursorMode`.
- Position must NOT be animated (no lag); shape MUST be animated.
- `pointer-events: none` on the dot — never intercepts mouse events.
- Do not modify `CursorContext.tsx` or `useCursor.ts`.

## Build steps
1. Create `CursorDot.module.css` with `.dot`: `position: fixed; top: 0; left: 0; transform: translate(-50%, -50%); pointer-events: none; border-style: solid; z-index: 9999;`
2. Create `CursorDot.tsx`. Declare named constants: `DOT_SIZE`, `RING_SIZE`, `RING_BORDER`, `TRANSITION_DURATION`, `FULL_RADIUS`.
3. Import `type CursorMode` from `../context/CursorContext`; import `useCursor` from `../hooks/useCursor`; import `motion` from `framer-motion`.
4. Define a `const SHAPES: Record<CursorMode, object>` mapping each mode to its `animate` target. Map `'hover'` to the same object as `'default'`.
5. In the component: call `useCursor()`, render `<motion.div className={styles.dot} style={{ left: x, top: y }} animate={SHAPES[mode]} transition={{ duration: TRANSITION_DURATION, ease: 'easeOut' }} />`.
6. Edit `apps/frontend/src/index.css`: add `cursor: none;` to the `body` block.
7. Edit `RootLayout.tsx`: import `CursorDot`; render `<CursorDot />` as the first child inside `<CursorProvider>`.
8. Run `pnpm --filter frontend lint` and fix any issues.

## Notes for the implementer
**Out of scope:** `data-cursor-hint` tooltip (step 73), magnifier (step 74), `'hover'` special behavior, hide-on-mouseleave, touch device handling.

**Files affected:**
- CREATE `apps/frontend/src/components/CursorDot.tsx`
- CREATE `apps/frontend/src/components/CursorDot.module.css`
- EDIT `apps/frontend/src/components/RootLayout.tsx`
- EDIT `apps/frontend/src/index.css`

**Gotchas:**
- Initial render sits at `0,0` until first `mousemove` — acceptable for MVP.
- `border-style: solid` must be in CSS so Framer Motion's `borderWidth: 2` renders visibly on `'pointer'` mode.
- `cursor: none` hides the native cursor globally — verify the dot renders correctly before shipping.
- Touch devices: dot will stay at `0,0` since no `mousemove` fires. Deferred.
- No z-index conflicts found in reviewed files, but a future modal/overlay may need a higher z-index than 9999.
