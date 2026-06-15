# Implementation Task: TanStack Query Client with Global Config and Devtools

## What to build
Create a single module-scoped `QueryClient` instance with sensible global defaults for a data-heavy app, wrap the application's `RouterProvider` in a `QueryClientProvider` so query hooks are available inside all route components, and render the React Query Devtools in development only.

## Current state
- `apps/frontend/src/main.tsx` — renders `<App />` inside `<StrictMode>`; no provider wrapping.
- `apps/frontend/src/App.tsx` — returns `<RouterProvider router={router} />` (default export).
- `apps/frontend/src/router.tsx` — `createBrowserRouter` with lazy routes for `/races`, `/races/:id`, `/ask`; no data loaders.
- `@tanstack/react-query` v5.101.0 — already installed.
- `@tanstack/react-query-devtools` — NOT installed; must be added.
- React 19.2.6, Vite 8, TypeScript ~6.0.2.
- No `lib/`, `providers/`, or `query/` directory exists under `src/` yet.
- Backend API base URL: `http://localhost:3000` (for context only; no API calls in this step).

## Deliverables (definition of done)
1. `@tanstack/react-query-devtools` added to `devDependencies` in `apps/frontend/package.json`, with a major version matching the installed `@tanstack/react-query` (v5).
2. A dedicated module (e.g. `src/lib/queryClient.ts`) exports a single `QueryClient` instance created at module scope (not inside a component), with named export, configured with the global defaults below.
3. Global `defaultOptions.queries` set explicitly with documented constants (no magic numbers): `staleTime`, `retry`, `refetchOnWindowFocus`. Recommended starting values — `staleTime: 60_000` (60s), `retry: 1`, `refetchOnWindowFocus: false`. Each numeric value extracted to a named constant.
4. `QueryClientProvider` (using the exported `queryClient`) wraps `RouterProvider`. The provider must be an ancestor of `RouterProvider` so all route components can call query hooks.
5. React Query Devtools render only in development — gated by `import.meta.env.DEV` and/or excluded from the production bundle (lazy import). Devtools must NOT appear in a production `vite build`.
6. `pnpm --filter frontend lint` passes with no new errors.
7. `pnpm --filter frontend build` succeeds (`tsc -b && vite build`) with no type errors.
8. Existing routing behaviour is unchanged — app still redirects `/` → `/races` and renders all three pages.

## Rules that must hold
- TypeScript only; no `any`. Devtools dynamic import must be typed.
- Named export for the `QueryClient` instance; `App` may remain a default export.
- No magic numbers — `staleTime`, `retry` thresholds extracted to named constants with units in the name or a comment.
- No inline styles; no API/Axios code introduced in this step.
- One concern per file — keep the `QueryClient` definition separate from the provider wiring.
- Backward compatible — do not alter `router.tsx` route definitions.
- Devtools must be dev-only and must not ship in the production bundle.

## Build steps
1. Install devtools: `pnpm --filter frontend add -D @tanstack/react-query-devtools`.
2. Create `src/lib/queryClient.ts`: define named constants for the defaults, instantiate one `QueryClient` with `defaultOptions.queries`, and export it.
3. In `App.tsx`, wrap `<RouterProvider router={router} />` with `<QueryClientProvider client={queryClient}>`.
4. Add the devtools component as a sibling of `RouterProvider` inside the provider, gated so it only renders when `import.meta.env.DEV` is true. Use a lazy/dynamic import so the devtools code is tree-shaken out of production builds.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any type/lint issues.
6. Manually verify: dev server shows the devtools toggle; production build does not include devtools.

## Notes for the implementer
**Out of scope:** Any `useQuery`/`useMutation` calls or Axios `api/` layer (Steps 53+). `ErrorBoundary` (Step 43) and `RootLayout` (Step 44) — place `QueryClientProvider` so it will sit above them when they land.

**Files likely affected:**
- `apps/frontend/package.json` (new devDependency)
- `apps/frontend/src/lib/queryClient.ts` (new)
- `apps/frontend/src/App.tsx` — provider + devtools wiring

**Gotchas:**
- The `QueryClient` MUST be created at module scope, not inside the `App` component — otherwise React 19 StrictMode re-renders/remounts would recreate it and discard the cache.
- v5 devtools import: `import { ReactQueryDevtools } from '@tanstack/react-query-devtools'`. For guaranteed prod exclusion, use a lazy import (`React.lazy(() => import(...).then(d => ({ default: d.ReactQueryDevtools })))`) wrapped in `<Suspense>` and rendered only under `import.meta.env.DEV`.
- The provider must wrap `RouterProvider`, not be a child route — query hooks called in route components need the context above the router.

**Open questions (non-blocking):**
1. Confirm preferred `staleTime` — 60s assumes race/athlete data changes infrequently.
2. Wiring location preference: `App.tsx` vs `main.tsx`. Spec assumes `App.tsx`.