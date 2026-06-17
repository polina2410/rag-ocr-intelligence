# Implementation Task: CursorProvider context

## What to build
A read-only React context (`CursorProvider`) that tracks the mouse position via a single `window` `mousemove` listener and exposes derived `x`, `y`, `hint`, and `mode` values. Consumers (steps 71–74) read this state; the provider exposes no setters. This step produces the context module only — no hook (step 71), no visual cursor (step 72), no tooltip rendering (step 73), no magnifier (step 74).

## Current state
- `apps/frontend/src/context/` — directory does NOT exist yet; must be created.
- `apps/frontend/src/hooks/useSSE.ts` — only existing custom hook; reference for conventions: named export, `const` arrow, `useCallback` for handlers, `useEffect` cleanup return, exported result `interface`, no `any`.
- `apps/frontend/src/components/RootLayout.tsx` — `export const RootLayout = () => (...)`; renders `<Navbar />` then `<ErrorBoundary><Suspense><Outlet /></Suspense></ErrorBoundary>` inside `<div className={styles.layout}>`. This is the single wrapper around all routed content.
- `apps/frontend/src/App.tsx` — uses `<RouterProvider router={router} />` (object-router, NOT `<Outlet>`-as-children). Because routing is config-based, a provider in `App.tsx`/`main.tsx` cannot wrap routed pages without also wrapping `RouterProvider`; `RootLayout` is the cleanest single point that wraps Navbar + all pages. **Decision: mount `CursorProvider` in `RootLayout`.**
- `apps/frontend/src/main.tsx` — renders `<StrictMode><App /></StrictMode>`. StrictMode double-invokes effects in dev; the `mousemove` effect must be idempotent (add one listener, remove in cleanup).
- Stack: React 19, Vite, TypeScript strict (no `any`). No state library beyond React context + TanStack Query.

## Deliverables (definition of done)
1. New file `apps/frontend/src/context/CursorContext.tsx`.
2. Exported `type CursorMode = 'default' | 'hover' | 'pointer'` — `'hover'` is reserved for downstream steps even though step 70 never produces it.
3. Exported `interface CursorContextValue { x: number; y: number; hint: string | null; mode: CursorMode }` — exactly these four read-only fields, NO setter functions.
4. Exported `CursorContext` React context object created with `createContext<CursorContextValue>(...)` initialized to `{ x: 0, y: 0, hint: null, mode: 'default' }`.
5. Exported `const CursorProvider` arrow component accepting `{ children: ReactNode }` and providing a live `CursorContextValue`.
6. A single `mousemove` listener attached to `window` inside a `useEffect`, removed via `removeEventListener` in the effect's cleanup return.
7. On each `mousemove`: `x = event.clientX`, `y = event.clientY`; `hint` = value of `data-cursor-hint` on the nearest self-or-ancestor element of `event.target`, else `null`; `mode = 'pointer'` when the nearest self-or-ancestor matches `a, button, [role="button"], [tabindex]`, else `'default'`.
8. The `mousemove` handler is wrapped in `useCallback` and is the same reference passed to both `addEventListener` and `removeEventListener`.
9. `CursorProvider` is mounted in `apps/frontend/src/components/RootLayout.tsx`, wrapping `<Navbar />` and the `<ErrorBoundary>...</ErrorBoundary>` block inside the layout `<div>`.
10. No CSS file — step 70 has no visual output.
11. `pnpm --filter frontend lint` passes with no `any`.

## Rules that must hold
- Named exports only; no default export. `const` arrow function for the component.
- Exports from `CursorContext.tsx`: `CursorMode`, `CursorContextValue`, `CursorContext`, `CursorProvider` (all four).
- Strict TypeScript, no `any`. Narrow `event.target` with `instanceof Element` before calling `.closest()`.
- Context value is READ-ONLY — no `setMode`/`setHint`/`setX`/`setY` on `CursorContextValue`.
- Exactly one `mousemove` listener on `window`, cleaned up on unmount. No listeners on `document` or individual elements.
- Do NOT implement the hook, `CursorDot`, tooltip rendering, or magnifier — those are steps 71–74.
- Do NOT modify `Navbar`, `ErrorBoundary`, routes, or page components beyond mounting the provider in `RootLayout`.
- No magic strings inline — extract the interactive selector and attribute name as named constants.

## Build steps
1. Create `apps/frontend/src/context/CursorContext.tsx`.
2. Import `createContext`, `useCallback`, `useEffect`, `useState`, and type `ReactNode` from `react`.
3. Declare and export `CursorMode` type and `CursorContextValue` interface (deliverables #2, #3).
4. Define module-level constants: `INTERACTIVE_SELECTOR = 'a, button, [role="button"], [tabindex]'` and `CURSOR_HINT_ATTR = 'data-cursor-hint'` — no inline string literals.
5. Create and export `CursorContext` with default value `{ x: 0, y: 0, hint: null, mode: 'default' }`.
6. Implement `CursorProvider`: single `useState<CursorContextValue>` initialized to the same defaults.
7. Define the `useCallback` handler: narrow `event.target` with `instanceof Element`; compute `hint` via `target.closest('[${CURSOR_HINT_ATTR}]')?.getAttribute(CURSOR_HINT_ATTR) ?? null`; compute `mode` via `target.closest(INTERACTIVE_SELECTOR) ? 'pointer' : 'default'`; if not an `Element`, use `hint: null, mode: 'default'`. Call `setState` once with all four values.
8. `useEffect`: `window.addEventListener('mousemove', handler)`; return `() => window.removeEventListener('mousemove', handler)`. Dependency array `[handler]`.
9. Return `<CursorContext.Provider value={state}>{children}</CursorContext.Provider>`.
10. Edit `RootLayout.tsx`: import `CursorProvider`; wrap the contents of the layout `<div>` in `<CursorProvider>`.
11. Run `pnpm --filter frontend lint` and fix any errors.

## Notes for the implementer
**Out of scope:** `useCursor` hook (step 71), `CursorDot` (step 72), tooltip rendering (step 73), magnifier (step 74), throttling/`requestAnimationFrame`, touch/pointer events.

**Files affected:**
- CREATE `apps/frontend/src/context/CursorContext.tsx`
- EDIT `apps/frontend/src/components/RootLayout.tsx`

**Gotchas:**
- `Element.closest()` matches self-or-ancestor in one call — no manual DOM walk needed.
- `event.target` may be `null` or non-`Element` (e.g. `Document`); guard with `instanceof Element`.
- StrictMode mounts effects twice in dev; correct add/remove pairing keeps this leak-free.
- Use a single `setState` call per move (one object) — not four separate calls — to keep all fields consistent in a single render.
- `'hover'` is in the union but never produced by step 70's auto-detection; do not remove it.

**Edge cases:**
- Cursor over plain text → `hint: null`, `mode: 'default'`
- Cursor over `<button>` with no `data-cursor-hint` → `mode: 'pointer'`, `hint: null`
- Cursor over hinted element that is also interactive → both `hint` and `mode: 'pointer'` set correctly via independent `closest()` calls
