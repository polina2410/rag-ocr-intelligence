# Current Feature: React Router with Lazy Routes

## Status
In Progress

## Goals
- `pages/RacesPage.tsx` exists as a default-export arrow component with placeholder "Races" heading
- `pages/RaceDetailPage.tsx` exists, reads `:id` param via `useParams` and displays it
- `pages/AskPage.tsx` exists as a default-export arrow component with placeholder "Ask" heading
- Router defined with exactly three routes: `/races` → RacesPage, `/races/:id` → RaceDetailPage, `/ask` → AskPage
- Each route loads its page component lazily via `React.lazy()` or v7 route `lazy` property
- `App.tsx` renders `<RouterProvider router={...} />` (no more `<h1>Hello</h1>`)
- `main.tsx` unchanged — still mounts `<App />` inside `<StrictMode>`
- `pnpm --filter frontend build` passes (tsc + vite, no type errors)
- `pnpm --filter frontend lint` passes
- Manual verify: `/races`, `/races/123`, `/ask` each render correct placeholder; `/races/123` shows `123`

## Notes
- Use React Router v7 API: `createBrowserRouter` + `RouterProvider`. Do NOT use `<BrowserRouter>` or JSX `<Routes>`/`<Route>`.
- Page components must be `const` arrow functions with default exports (project convention + `React.lazy` requirement).
- Do NOT wire up TanStack Query, data fetching, Suspense fallbacks, ErrorBoundary, or RootLayout — deferred to Steps 41–44.
- Suspense gotcha: if using `React.lazy()`, wrap routes in a temporary `<Suspense fallback={null}>` until Step 41 adds proper fallbacks. Alternatively, use RR v7's route-level `lazy` property (module must export `Component`, not default).
- Spec: `context/specs/step-40-react-router-lazy-routes.md`

## History

<!-- Completed features are tracked in context/features-history.md -->