# Implementation Task: ErrorBoundary component

## What to build
A reusable React class-based `ErrorBoundary` component that catches render-phase errors in its subtree, displays a default fallback UI (error message + "Try again" reset action), and allows callers to override the fallback. It is the reusable mechanism that Step 44 (`RootLayout`) will wrap the page slot with.

## Current state
- `apps/frontend/src/components/RouteFallback.tsx` — named export, `const` arrow fn, imports a co-located `.module.css`. Use as the pattern reference.
- `apps/frontend/src/components/RouteFallback.module.css` — uses `var(--color-border)` and `var(--color-accent)`.
- `apps/frontend/src/router.tsx` — per-route `<Suspense fallback={<RouteFallback />}>` wrappers; no `errorElement` set (out of scope here).
- `apps/frontend/src/App.tsx` — `QueryClientProvider` > `RouterProvider`; no boundary wired yet.
- `--color-accent` and `--color-border` defined in `index.css` `:root`.
- React 19.2.6, TypeScript ~6.0.2, Vite 8. No error-boundary library installed.
- No `ErrorBoundary` exists anywhere in the project.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/ErrorBoundary.tsx` exporting a **named** `ErrorBoundary` class component.
2. The class extends `Component<ErrorBoundaryProps, ErrorBoundaryState>` (React class component — required by React for error boundaries).
3. Props type includes: `children: ReactNode` and an optional `fallback` render-prop `(error: Error, reset: () => void) => ReactNode`.
4. State shape `{ hasError: boolean; error: Error | null }` initialised to no-error.
5. `static getDerivedStateFromError(error: unknown)` implemented — updates state to the error condition.
6. `componentDidCatch(error: unknown, info: ErrorInfo)` implemented — logs via `console.error`; caught values typed as `unknown`, narrowed before use.
7. A `reset` method sets state back to no-error so the subtree re-mounts.
8. When no error: renders `this.props.children` unchanged.
9. When error present and no `fallback` prop: renders default fallback UI with (a) a human-readable error message and (b) a "Try again" button wired to `reset`.
10. When error present and `fallback` supplied: renders `fallback(error, reset)` instead of the default.
11. New file `apps/frontend/src/components/ErrorBoundary.module.css` — all styling for the default fallback UI. No inline styles.
12. Default fallback styling uses `var(--color-accent)` and `var(--color-border)` where applicable.
13. `pnpm --filter frontend lint` passes. No `any` types.
14. `pnpm --filter frontend build` succeeds.

## Rules that must hold
- The boundary MUST be a class component with `getDerivedStateFromError` + `componentDidCatch` — the only React-supported mechanism.
- Caught errors typed as `unknown`; narrow with `instanceof Error` before reading `.message`. No `any`.
- Named export; one component per file.
- No inline styles — CSS Module only.
- Do NOT modify `router.tsx`, `App.tsx`, or add `errorElement` — wiring into the tree is Step 44's job.
- Do NOT install any npm packages.

## Build steps
1. Create `ErrorBoundary.module.css` with classes for the fallback container, message, and "Try again" button.
2. Create `ErrorBoundary.tsx`: define `ErrorBoundaryProps` and `ErrorBoundaryState` types.
3. Implement the class: initialise state, `static getDerivedStateFromError`, `componentDidCatch` (console.error), `reset` method.
4. Implement `render()`: no error → children; error + fallback prop → `fallback(error, reset)`; else → default CSS Module UI with "Try again" button.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
**Out of scope:** wiring into `RootLayout`/`App` (Step 44), React Router `errorElement`, error-reporting services, retry-with-backoff.

**Files affected:** only the two new files in `apps/frontend/src/components/`. No existing files should change.

**Edge cases:** `reset` that re-renders the same broken subtree will immediately error again — acceptable for this step. The default UI's "Try again" button calls `reset` only; an optional `window.location.reload()` is fine but not required.

**React error boundaries do not catch** errors in event handlers, async code, or SSR.