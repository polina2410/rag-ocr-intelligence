# Current Feature: RootLayout

## Status
In Progress

## Goals
- `components/RootLayout.tsx` — named `const` arrow export; renders placeholder `<header>` + `<Outlet />` page slot
- `<Outlet />` wrapped by `ErrorBoundary` → `<Suspense fallback={<RouteFallback />}>`
- `components/RootLayout.module.css` — layout shell + header styles using `var(--color-border)` / `var(--color-accent)`; no inline styles
- `router.tsx` rewired: top-level `/` redirect + parent route `{ element: <RootLayout /> }` with `/races`, `/races/:id`, `/ask` as children
- Per-route `<Suspense>` wrappers removed from `router.tsx`; lazy page imports stay
- All four URLs (`/`, `/races`, `/races/:id`, `/ask`) still resolve correctly
- `pnpm --filter frontend lint` passes
- `pnpm --filter frontend build` passes; placeholder header visible on all three routes

## Notes
- No Navbar, PageWrapper, or CursorProvider — deferred to steps 45, 46, 66
- `/` redirect stays as a top-level sibling route, NOT nested under RootLayout (avoids rendering chrome around a redirect)
- Suspense moves from per-route into RootLayout — header stays visible during lazy page load
- Header placeholder: a `<header>` with text label (e.g. "ocr-intelligence") is sufficient; step 45 replaces it
- `ErrorBoundary` imported as named import from `./ErrorBoundary`
- Spec: `context/specs/step-44-root-layout.md`

## History

<!-- Completed features are tracked in context/features-history.md -->