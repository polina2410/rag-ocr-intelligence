# Current Feature: CursorProvider Context

## Status
In Progress

## Goals

- NEW `apps/frontend/src/context/CursorContext.tsx` — exports `CursorMode`, `CursorContextValue`, `CursorContext`, `CursorProvider`
- `type CursorMode = 'default' | 'hover' | 'pointer'` — `'hover'` reserved for downstream steps
- `interface CursorContextValue { x: number; y: number; hint: string | null; mode: CursorMode }` — read-only, no setters
- `CursorContext` created with `createContext<CursorContextValue>({ x: 0, y: 0, hint: null, mode: 'default' })`
- `CursorProvider` arrow component: single `useState<CursorContextValue>`, single `mousemove` listener on `window` via `useEffect`, cleaned up on unmount
- Handler (wrapped in `useCallback`): narrows `event.target` with `instanceof Element`; derives `hint` via `closest('[data-cursor-hint]')?.getAttribute(...)` and `mode` via `closest('a, button, [role="button"], [tabindex]')` — one `setState` call per move
- Module-level constants for `INTERACTIVE_SELECTOR` and `CURSOR_HINT_ATTR` — no inline strings
- `CursorProvider` mounted in `RootLayout.tsx` wrapping `<Navbar />` + `<ErrorBoundary>` block
- `pnpm --filter frontend lint` passes, no `any`

## Notes

- `context/` directory does not exist yet — create it
- `RootLayout` is the correct mount point (`App.tsx` uses object-based `RouterProvider`, can't wrap from outside)
- StrictMode double-mounts effects in dev — add/remove pairing must be idempotent
- Single `setState` call per move to keep x/y/hint/mode consistent in one render
- `'hover'` is in the union but step 70 never produces it — do not remove it
- No CSS — step 70 has no visual output
- Spec: `context/specs/step-70-cursor-provider.md`

## History

<!-- Completed features are tracked in context/features-history.md -->
