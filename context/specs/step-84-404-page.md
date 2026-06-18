# Implementation Task: 404 Not Found Page

## What to build
A catch-all 404 page that renders when a user navigates to an unmatched URL. It lives inside `RootLayout` (so the navbar is present), explains that the page was not found, and offers a link back to the main app.

## Current state
- `apps/frontend/src/router.tsx` — `createBrowserRouter` with routes for `/` (redirects to `/races`), `/races`, `/races/:id`, `/ask`, `/upload`. The four content routes are children of `<RootLayout />`. No catch-all (`path: '*'`) route exists — unmatched URLs currently fall through to React Router's default bare error screen with no navbar.
- `apps/frontend/src/components/RootLayout.tsx` — wraps children in `CursorProvider`, renders `Navbar`, `ErrorBoundary`, and a `Suspense` boundary around `<Outlet />`. Calls `useFocusOnRouteChange()` for focus management on route change.
- `apps/frontend/src/components/PageWrapper.tsx` — renders a `<main>` with max-width and padding via `PageWrapper.module.css`.
- `apps/frontend/src/components/EmptyState.tsx` — reusable centered block with `title`, optional `description`, `icon`, and `action` (all via `EmptyState.module.css`). Good fit for the 404 body.
- `apps/frontend/src/pages/AskPage.tsx` — example page; uses a visually-hidden `<h1>`, CSS Modules, default export.
- `apps/frontend/src/components/Navbar.tsx` — uses `Link` / `NavLink` from `react-router-dom`.
- Stack: React 19, React Router DOM (lazy routes), TypeScript, CSS Modules. No Tailwind, no inline styles. Pages use default exports; components use named exports.

## Deliverables (definition of done)
1. A new page component `apps/frontend/src/pages/NotFoundPage.tsx` with a `default` export, rendering the 404 content.
2. The page renders a single visible-or-visually-hidden `<h1>` (exactly one `<h1>`) and content wrapped in `PageWrapper` (or its own `<main>`, matching the `AskPage` pattern — pick one, do not double-nest `<main>`).
3. The page body uses the existing `EmptyState` component with: a `title` (e.g. "Page not found"), a `description` explaining the URL doesn't exist, and an `action` containing a React Router `Link` to `/races` labelled e.g. "Back to races".
4. `router.tsx` includes a catch-all route `{ path: '*', element: <NotFoundPage /> }` placed as the **last** child of the `<RootLayout />` children array, so the navbar and layout render on 404.
5. `NotFoundPage` is imported via `lazy(() => import('./pages/NotFoundPage'))`, consistent with the other page imports in `router.tsx`.
6. Navigating to any unmatched path (e.g. `/nonexistent`, `/races/999/foo`) renders the 404 page **with the navbar visible**, not React Router's default error screen.
7. The "Back to races" link navigates to `/races` via client-side routing (no full page reload).
8. A `NotFoundPage.module.css` exists if any page-specific styling is needed; otherwise styling is delegated entirely to `EmptyState`/`PageWrapper` and no new CSS file is added.
9. `pnpm --filter frontend lint` passes with no new errors.
10. `pnpm --filter frontend build` succeeds.

## Rules that must hold
- CSS Modules only — no inline styles, no Tailwind.
- Page component uses a `default` export; any helper components use named exports.
- Use `const` arrow function for the component.
- No `any` types.
- No magic numbers — extract named constants if any are introduced.
- The catch-all route MUST be a child of `RootLayout` so the navbar renders (do not add it as a top-level sibling route).
- Reuse `EmptyState` and `PageWrapper` rather than re-implementing centered-content layout.
- Exactly one `<h1>` on the page (a11y — consistent with `AskPage`).
- Do not modify the existing `/`, `/races`, `/races/:id`, `/ask`, or `/upload` route behavior.

## Build steps
1. Create `apps/frontend/src/pages/NotFoundPage.tsx`. Model structure on `AskPage.tsx`: a wrapping container (`PageWrapper` or `<main>`), one `<h1>`, and an `EmptyState` with `title`, `description`, and an `action` `Link` to `/races`.
2. If page-specific spacing is needed, add `apps/frontend/src/pages/NotFoundPage.module.css`; otherwise rely on `EmptyState`/`PageWrapper`.
3. In `router.tsx`, add `const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))` alongside the other lazy imports.
4. In `router.tsx`, append `{ path: '*', element: <NotFoundPage /> }` as the **last** entry in the `children` array of the `<RootLayout />` route object.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues.
6. Manually verify: navigate to `/nonexistent` → navbar visible + 404 content shown; click "Back to races" → lands on `/races` without a full reload.

## Notes for the implementer
- **Focus management:** `RootLayout` already calls `useFocusOnRouteChange()`, so navigating to the 404 route handles focus automatically — no extra focus code needed in the page.
- **Why inside RootLayout:** placing `path: '*'` as a top-level sibling (outside `RootLayout`) would render the 404 without the navbar and without `CursorProvider`. It must go in the children array.
- **Suspense:** because it's a `lazy` route under `RootLayout`'s `Suspense`, the existing `RouteFallback` covers the loading flash — no extra boundary required.
- **`/races/:id` edge case:** `/races/anything` still matches the `:id` route (handled by `RaceDetailPage`'s own not-found/empty handling), so the catch-all only fires for genuinely unmatched path shapes. This is expected — confirm `RaceDetailPage`'s invalid-id handling is out of scope here.
- **Out of scope:** custom 404 illustrations/animations (Framer Motion), backend 404 handling, redirects for legacy URLs, analytics/logging of 404 hits.
- **Open question (non-blocking):** exact copy for title/description/link label is left to the implementer; suggested defaults given above.
- **Open question (non-blocking):** whether the `<h1>` should be visible or visually hidden. `AskPage` hides its `<h1>`; for a 404 a visible heading is usually preferable for clarity. Defaulting to visible is recommended unless it conflicts with the `EmptyState` visual design.
