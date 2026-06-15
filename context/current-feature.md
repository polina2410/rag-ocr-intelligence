# Current Feature: Per-Route Suspense Boundaries with Fallbacks

## Status
In Progress

## Goals
- Each of `/races`, `/races/:id`, `/ask` wrapped in its own `<Suspense>` boundary with a non-null fallback
- Root `<Suspense fallback={null}>` removed from `App.tsx` — renders `<RouterProvider router={router} />` directly
- All three routes share one identical fallback: a CSS spinner component (not plain text, not `null`)
- The `/` → `/races` redirect preserved unchanged
- `pnpm --filter frontend lint` passes
- `pnpm --filter frontend build` passes
- Manual verify: spinner visible under network throttle, then page content loads

## Notes
- Build a minimal `RouteFallback` component (e.g. `apps/frontend/src/components/RouteFallback.tsx`) rendering a CSS spinner — named export, `const` arrow function, one file
- Style via CSS Module (`.module.css`) — no inline styles
- Wrap each route element in `router.tsx` in `<Suspense fallback={<RouteFallback />}>` — NOT the redirect route
- Do NOT add ErrorBoundary (step 43), RootLayout (step 44), or skeleton components (steps 48–50)
- Preserve the `eslint-disable react-refresh/only-export-components` directive in `router.tsx`
- Spec: `context/specs/step-41-suspense-boundaries.md`

## History

<!-- Completed features are tracked in context/features-history.md -->