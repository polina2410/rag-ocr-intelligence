# Implementation Task: Per-Route Suspense Boundaries with Fallbacks

## What to build
Replace the single root-level `<Suspense fallback={null}>` in `App.tsx` with per-route `<Suspense>` boundaries, so each lazy route (`/races`, `/races/:id`, `/ask`) renders its own meaningful loading fallback while its chunk loads. Fallbacks must be minimal inline placeholders (a simple loading indicator), since dedicated skeleton components are out of scope for this step.

## Current state
- `apps/frontend/src/App.tsx` — wraps `<RouterProvider>` in a single `<Suspense fallback={null}>` (this is the temporary placeholder being removed).
- `apps/frontend/src/router.tsx` — defines 3 lazy routes via `lazy(() => import(...))`: `RacesPage`, `RaceDetailPage`, `AskPage`, plus a `Navigate` redirect from `/` to `/races`. Has `/* eslint-disable react-refresh/only-export-components */` at the top.
- `apps/frontend/src/pages/RacesPage.tsx`, `RaceDetailPage.tsx`, `AskPage.tsx` — placeholder stubs, each a single `<h1>`, default-exported.
- No `components/` directory exists yet.
- No skeleton components exist (steps 48–50).
- No `.module.css` files exist anywhere in the frontend yet.
- `react-router-dom` v7.17.0, React 19.2.6, TypeScript ~6.0.2, Vite 8.

## Deliverables (definition of done)
1. Each of the three lazy routes (`/races`, `/races/:id`, `/ask`) is individually wrapped in its own `<Suspense>` boundary with a non-null `fallback` prop.
2. The `<Suspense fallback={null}>` wrapper in `App.tsx` is removed; `App.tsx` renders `<RouterProvider router={router} />` directly (no root Suspense).
3. Each fallback renders a visible, minimal loading indicator (e.g. a `<div>` with text or a simple spinner) — not `null`, and not a full skeleton component.
4. The `/` → `/races` redirect (`<Navigate to="/races" replace />`) is preserved unchanged.
5. `pnpm --filter frontend lint` passes with no new errors or warnings.
6. `pnpm --filter frontend build` succeeds.
7. Navigating to each route in the dev server shows the fallback briefly (verifiable by throttling network), then the page content.

## Rules that must hold
- Per-route fallbacks: each route gets its own `<Suspense>` — do NOT reintroduce a single shared root-level boundary.
- Fallbacks must be lightweight and inline-buildable here. Do NOT build `SkeletonCard`/`SkeletonTable`/`SkeletonChart` (steps 48–50) — those will replace these fallbacks later.
- No inline styles (project rule) — if a fallback needs styling, use a CSS Module (`.module.css`) or plain CSS; a plain unstyled text/`<div>` fallback with no styling is acceptable for this step.
- Keep `react-router-dom` v7 `createBrowserRouter` data-router structure intact.
- Do NOT add an `ErrorBoundary` (step 43) or `RootLayout` (step 44).
- Preserve the existing `eslint-disable react-refresh/only-export-components` directive in `router.tsx` if lazy variables remain co-located with the `router` export.
- One component per file if any new component file is created.

## Build steps
1. Decide where the per-route `<Suspense>` wrappers live — wrap each route's `element` in `router.tsx` (recommended, keeps boundaries co-located with each lazy route). Confirm this is the chosen location before editing.
2. Create a minimal fallback. Two acceptable options:
   - (a) A simple inline element per route, e.g. `<div>Loading…</div>`, or
   - (b) A single tiny shared `RouteFallback` component (e.g. `apps/frontend/src/components/RouteFallback.tsx`) rendering a minimal loading indicator, reused across routes. If created, it must be a `const` arrow function with a named export, one component per file.
3. In `router.tsx`, wrap each route `element` for `/races`, `/races/:id`, and `/ask` in `<Suspense fallback={...}>`.
4. Update `App.tsx` to remove the `Suspense` import and the `<Suspense fallback={null}>` wrapper, rendering `<RouterProvider router={router} />` directly.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.
6. Manually verify each route shows its fallback then content (throttle network in devtools to observe).

## Notes for the implementer
**Out of scope:** Skeleton components (steps 48–50), ErrorBoundary (step 43), RootLayout (step 44), TanStack Query setup (step 42). The minimal fallbacks here are intentionally temporary and will be swapped for skeletons later.

**Files likely affected:**
- `apps/frontend/src/router.tsx` (add per-route Suspense wrappers)
- `apps/frontend/src/App.tsx` (remove root Suspense)
- Optionally new: `apps/frontend/src/components/RouteFallback.tsx` (+ optional `.module.css`)

**Constraints / gotchas:**
- React Router v7 `createBrowserRouter` does not require Suspense to render lazy `React.lazy` components, but without it React throws on the suspended import — wrapping each `element` is the correct pattern here. (Note: this uses `React.lazy`, distinct from React Router's own route-level `lazy` loader API — do not refactor to the latter for this step.)
- The redirect route (`/`) uses `<Navigate>`, which is synchronous and must NOT be wrapped in Suspense.
- If you create a shared `RouteFallback` in `router.tsx`'s file scope, the existing `react-refresh/only-export-components` disable comment already covers it; if you put it in its own file, that file needs only a normal named export.

**Open questions:**
1. Should each route have a visually distinct fallback (e.g. table-ish vs chart-ish), or is one identical minimal fallback acceptable for all three until skeletons land (steps 48–50)? Assumption: one identical minimal fallback is acceptable for this step. Confirm if differentiation is wanted now.
2. Preferred fallback text/indicator (plain `Loading…` text vs a CSS spinner)? Assumption: plain `Loading…` text is sufficient. Confirm if a spinner is required.