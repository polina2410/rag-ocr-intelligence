# Current Feature: TanStack Query Client with Global Config and Devtools

## Status
In Progress

## Goals
- `@tanstack/react-query-devtools` added to `devDependencies` (v5, matching installed react-query)
- `src/lib/queryClient.ts` exports a module-scoped `QueryClient` with named constants: `staleTime: 60_000`, `retry: 1`, `refetchOnWindowFocus: false`
- `App.tsx` wraps `<RouterProvider>` in `<QueryClientProvider client={queryClient}>`
- Devtools lazy-imported, rendered as sibling to `RouterProvider` inside the provider, gated by `import.meta.env.DEV` — excluded from prod bundle
- `pnpm --filter frontend lint` passes
- `pnpm --filter frontend build` passes — devtools not present in production bundle
- Routing unchanged: `/`, `/races`, `/races/:id`, `/ask` all still work

## Notes
- `QueryClient` must be created at module scope (not inside `App`) — StrictMode remounts would discard the cache otherwise
- Devtools: use `React.lazy(() => import('@tanstack/react-query-devtools').then(d => ({ default: d.ReactQueryDevtools })))` + `<Suspense>` so the chunk is tree-shaken from prod
- `QueryClientProvider` must be an ancestor of `RouterProvider` (not a child route) so hooks work inside route components
- Do NOT add ErrorBoundary (step 43), RootLayout (step 44), or any API/Axios code
- Spec: `context/specs/step-42-tanstack-query-client.md`

## History

<!-- Completed features are tracked in context/features-history.md -->