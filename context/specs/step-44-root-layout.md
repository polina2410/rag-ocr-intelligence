# Implementation Task: RootLayout

## What to build
A `RootLayout` component that renders a persistent page chrome (a placeholder `<header>` slot for the future Navbar) and a routed page slot via React Router's `<Outlet />`, with the page slot wrapped in the existing `ErrorBoundary`. Rewire `router.tsx` so the three content routes render as children of a single `RootLayout` parent route.

## Current state
- `apps/frontend/src/router.tsx` — flat route array (4 routes); `/` redirects to `/races`; each content route individually wrapped in `<Suspense fallback={<RouteFallback />}>`.
- `apps/frontend/src/App.tsx` — `QueryClientProvider` + `RouterProvider`; no layout involvement.
- `apps/frontend/src/components/ErrorBoundary.tsx` — named class export `ErrorBoundary`; props `{ children, fallback? }`; default fallback UI + `reset`.
- `apps/frontend/src/components/RouteFallback.tsx` — named export; CSS spinner.
- `apps/frontend/src/index.css` — `:root` tokens `--color-accent: #6366f1`, `--color-border: #e5e7eb`.
- React 19.2.6, React Router DOM v7 (`createBrowserRouter`), TypeScript ~6.0.2, Vite 8.
- Does NOT exist yet: `Navbar` (step 45), `PageWrapper` (step 46), `CursorProvider` (step 66). Do not build them here.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/RootLayout.tsx` — `const` arrow function, named export `RootLayout`, one component per file.
2. `RootLayout` renders a placeholder `<header>` element above the page slot (no `Navbar` import — it doesn't exist yet).
3. `RootLayout` renders the routed page slot using `<Outlet />` from `react-router-dom`.
4. The `<Outlet />` is wrapped by `ErrorBoundary` (named import from `./ErrorBoundary`).
5. The `<Outlet />` is wrapped by a single `<Suspense fallback={<RouteFallback />}>` inside `RootLayout` — per-route `Suspense` wrappers in `router.tsx` are removed.
6. New file `apps/frontend/src/components/RootLayout.module.css` — all `RootLayout` styling; no inline styles.
7. `router.tsx` rewired: single parent route `{ element: <RootLayout /> }` with `/races`, `/races/:id`, `/ask` as children (no `path` on the parent). The `/` redirect stays as a top-level sibling.
8. Per-route `<Suspense>` wrappers removed from `router.tsx`; lazy page imports stay.
9. `pnpm --filter frontend lint` passes.
10. `pnpm --filter frontend build` succeeds; placeholder header visible on all three routes.

## Rules that must hold
- No inline styles — CSS Module only.
- Named export; one component per file; `const` arrow function.
- No `any` types.
- Do NOT create `Navbar`, `PageWrapper`, or `CursorProvider`.
- Do NOT stub `CursorProvider` — omit it entirely (added in step 66).
- All four URLs (`/`, `/races`, `/races/:id`, `/ask`) must continue to resolve correctly.
- Use `var(--color-border)` / `var(--color-accent)` tokens for any header styling.

## Build steps
1. Create `RootLayout.module.css` with a layout shell class and a placeholder header class (use `var(--color-border)` for a bottom border).
2. Create `RootLayout.tsx`: import `Outlet` from `react-router-dom`, `Suspense` from `react`, `ErrorBoundary`, `RouteFallback`, and the CSS module. Render: outer div → placeholder `<header>` → `<ErrorBoundary>` → `<Suspense fallback={<RouteFallback />}>` → `<Outlet />`.
3. In `router.tsx`, replace the flat route array with: (a) a top-level `/` redirect route; (b) a parent route `{ element: <RootLayout /> }` with children `[/races, /races/:id, /ask]` — each child as `{ path, element: <LazyPage /> }` with no Suspense wrapper.
4. Remove now-unused imports from `router.tsx` (`Suspense`, `RouteFallback`).
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.

## Notes for the implementer
**Redirect placement:** Keep `{ path: '/', element: <Navigate to="/races" replace /> }` as a top-level sibling — this avoids rendering the layout chrome around a redirect and keeps the diff small.

**Suspense behaviour change:** Moving `Suspense` into `RootLayout` means the header stays visible during lazy page load, rather than the spinner replacing the whole screen. This is intentional.

**Header placeholder:** A `<header>` with a text label (e.g. "ocr-intelligence") is enough. Step 45 replaces its contents with the real `Navbar`.

**Out of scope:** Navbar links (step 45), PageWrapper (step 46), CursorProvider (step 66), responsive nav, error telemetry.

**Files affected:** new `RootLayout.tsx` + `RootLayout.module.css`; modified `router.tsx`. No other files should change.