# Implementation Task: React Router with Lazy Routes

## What to build
Wire up React Router v7 in the frontend using `createBrowserRouter` + `RouterProvider`, with three lazily-loaded routes: `/races`, `/races/:id`, and `/ask`. Create minimal placeholder page components for each route so the lazy imports resolve at runtime.

## Current state
- `apps/frontend/src/App.tsx` — renders only `<h1>Hello</h1>`, no routing. This file will be replaced.
- `apps/frontend/src/main.tsx` — mounts `<App />` inside `<StrictMode>`. No router provider. Stays as-is (still renders `<App />`).
- `react-router-dom` v7.17.0 installed — v7 API uses `createBrowserRouter` + `RouterProvider`, NOT the v5/v6 `<BrowserRouter>` component.
- `@tanstack/react-query` v5.101.0 installed but NOT wired up (deferred to Step 42 — do not touch).
- React 19.2.6, Vite 8, TypeScript ~6.0.2.
- No `pages/` or `components/` directories exist yet.
- Backend already exposes `GET /races`, `GET /races/:id`, `POST /ask` (SSE) — but data fetching is OUT of scope here.

## Deliverables (definition of done)
1. `apps/frontend/src/pages/RacesPage.tsx` exists, is a `const` arrow component with a **default export**, renders identifiable placeholder content (e.g. a heading reading "Races").
2. `apps/frontend/src/pages/RaceDetailPage.tsx` exists, default export, renders placeholder content reading "Race Detail" and reads the `:id` route param (e.g. via `useParams`) and displays it.
3. `apps/frontend/src/pages/AskPage.tsx` exists, default export, renders placeholder content reading "Ask".
4. Router is defined (in `App.tsx` or a dedicated `apps/frontend/src/router.tsx`) with exactly three routes mapping:
   - `/races` → `RacesPage`
   - `/races/:id` → `RaceDetailPage`
   - `/ask` → `AskPage`
5. Each of the three routes loads its page component **lazily** via `React.lazy()` + dynamic `import()` (or the v7 route `lazy` mechanism — see notes).
6. `App.tsx` renders `<RouterProvider router={...} />` and no longer renders `<h1>Hello</h1>`.
7. `main.tsx` is unchanged in behavior — still renders `<App />` inside `<StrictMode>`.
8. `pnpm --filter frontend build` succeeds (tsc + vite build pass with no type errors).
9. `pnpm --filter frontend lint` passes.
10. Manual verification: navigating to `/races`, `/races/123`, `/ask` in the dev server each renders the correct placeholder, and `/races/123` shows `123`.

## Rules that must hold
- Use the **React Router v7** API: `createBrowserRouter` + `RouterProvider`. Do NOT use `<BrowserRouter>`, `<Routes>`, `<Route>` JSX-element routing.
- Page components MUST be **default exports** (required for `React.lazy`).
- Page components MUST be `const` arrow functions (project convention).
- One component per file.
- No `any` types — use `unknown` or proper generics if any typing is needed.
- No inline styles — placeholder content needs no styling, but if any is added use plain CSS / CSS Modules.
- Do NOT wire up TanStack Query, data fetching, Suspense fallbacks, ErrorBoundary, or RootLayout — those are Steps 41–44.
- Do not modify backend or shared `@ocr/types`.

## Build steps
1. Create `apps/frontend/src/pages/` directory.
2. Create `RacesPage.tsx`, `RaceDetailPage.tsx`, `AskPage.tsx` as minimal default-export arrow components (per Deliverables 1–3).
3. Decide router location: either inline in `App.tsx` or a dedicated `router.tsx` (preferred for separation). Define the route table with the three paths.
4. Wrap each route's element in a lazy-loaded component (`React.lazy(() => import('./pages/...'))`) or use the route `lazy` property.
5. Replace `App.tsx` body with `<RouterProvider router={router} />`.
6. Run `pnpm --filter frontend build` and `pnpm --filter frontend lint`; fix any errors.
7. Run `pnpm --filter frontend dev` and manually verify all three routes.

## Notes for the implementer
**Suspense gotcha:** `React.lazy` components must render inside a `<Suspense>` boundary or React throws. Step 41 adds proper per-route Suspense fallbacks, but for THIS step the lazy routes must still resolve without crashing. Two acceptable approaches:
- (a) Use React Router v7's route-level `lazy` property (`{ path, lazy: () => import(...) }`), which the router handles internally without requiring a manual `<Suspense>`. **Note:** with route `lazy`, the imported module must export the component as `Component` (or `element`), not as the module default — confirm the exact v7 contract before relying on this. If used, Deliverables 1–3's "default export" requirement is relaxed to "the export shape v7 `lazy` expects" — flag the deviation.
- (b) Use `React.lazy()` + a minimal placeholder `<Suspense fallback={null}>` wrapper now, to be replaced in Step 41.
Choose one and keep it consistent. If unsure which v7 contract applies, fetch current React Router v7 docs.

**Out of scope:** data fetching, loaders, error elements, nested/layout routes, 404 route, navbar/links. (Step 44 adds `RootLayout`; do not nest these routes under a layout yet.)

**Files likely affected:** `apps/frontend/src/App.tsx` (replaced), new `apps/frontend/src/pages/*.tsx`, optional new `apps/frontend/src/router.tsx`. `main.tsx` should NOT need changes.

**Open questions:**
1. Router file location — inline in `App.tsx` vs dedicated `router.tsx`? (Recommend `router.tsx`; not blocking.)
2. Should there be a root `/` redirect or index route? Not in the three specified paths — currently navigating to `/` will 404. Confirm whether a default redirect to `/races` is desired now or deferred to Step 44. (Non-blocking; assume deferred unless told otherwise.)
3. Lazy mechanism choice (a vs b above) — implementer's discretion per the Suspense note.