# Implementation Task: Navbar Component

## What to build
A `Navbar` component that renders the brand title and primary navigation links ("Races" → `/races`, "Ask AI" → `/ask`) with an active-state indicator using `react-router-dom` `NavLink`. `RootLayout` is updated to render `<Navbar />` in place of the current placeholder `<header>`.

## Current state
- `apps/frontend/src/components/RootLayout.tsx` — currently renders `<header className={styles.header}>ocr-intelligence</header>` (line 9) inside `.layout`; this placeholder must be replaced by `<Navbar />`.
- `apps/frontend/src/components/RootLayout.module.css` — has a `.header` rule (border-bottom, padding, font-weight). The `.header` rule becomes orphaned once the placeholder is removed and should be deleted.
- `apps/frontend/src/router.tsx` — routes confirmed: `/` redirects to `/races`; under `RootLayout`: `/races`, `/races/:id`, `/ask`.
- `apps/frontend/src/index.css` — `:root` defines `--color-accent: #6366f1` and `--color-border: #e5e7eb`. `font-family: system-ui, sans-serif` on `body`. No other color/spacing tokens exist.
- `react-router-dom` v7 — `NavLink` exposes active state via `className` callback receiving `{ isActive }` and via render-prop children.
- React 19.2.6, TypeScript ~6.0.2, Vite 8.
- Existing CSS Module convention: co-located `*.module.css` using `--color-accent` / `--color-border` tokens (see `RouteFallback.module.css`).
- No Navbar exists yet; no responsive breakpoint constants defined.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/Navbar.tsx` exporting a named `const` arrow-function component `Navbar` (one component per file).
2. New file `apps/frontend/src/components/Navbar.module.css` — all styling lives here; no inline styles.
3. Navbar renders the brand text "ocr-intelligence" as a logo/title element.
4. Navbar renders exactly two nav links: "Races" → `/races` and "Ask AI" → `/ask`. No link to `/races/:id`.
5. Each link is a `NavLink`; when its route is active, that link is visually distinct using `var(--color-accent)` (e.g. accent text color and/or accent underline/border).
6. Verifiable active behaviour: navigating to `/races` makes the "Races" link active; navigating to `/ask` makes "Ask AI" active. At `/races/:id` (detail page), the "Races" link MAY be active or inactive — default to active being acceptable.
7. Desktop layout: brand and links arranged in a horizontal row.
8. Responsive: at a narrow viewport the links remain visible and clickable (stacked or wrapped layout via a media query is acceptable — no hamburger menu required).
9. `RootLayout.tsx` updated — placeholder `<header>` replaced with `<Navbar />`; `RootLayout` still renders `Navbar` above the `ErrorBoundary`/`Suspense`/`Outlet` block.
10. Orphaned `.header` rule removed from `RootLayout.module.css` (no dead CSS).
11. `pnpm --filter frontend lint` passes; no `any` types introduced.

## Rules that must hold
- Named export, `const` arrow function, one component per file.
- No inline styles — CSS Module only.
- No `any` types.
- Only the two specified links; do NOT add a link for `/races/:id`.
- Active state must use `--color-accent`.
- Do NOT add `data-cursor-hint` attributes or any cursor integration (deferred to step 68).
- Do NOT introduce new global tokens unless a breakpoint constant is genuinely needed; if a breakpoint is used, keep it local to `Navbar.module.css`.
- Backward-compat: existing routing and `RootLayout` children behaviour must remain unchanged apart from the header swap.

## Build steps
1. Create `Navbar.module.css` with rules for the nav container (horizontal flex, bottom border consistent with prior `.header` look), brand/title, link base style, and active-link style using `var(--color-accent)`. Add a media query for narrow viewports so links wrap/stack.
2. Create `Navbar.tsx`: import `NavLink` from `react-router-dom` and the CSS module; render the brand title and the two `NavLink`s, applying the active class via the `className` callback (`{ isActive }`).
3. Update `RootLayout.tsx`: import `Navbar`, replace the placeholder `<header>` line with `<Navbar />`, and remove the now-unused `styles.header` reference.
4. Remove the `.header` rule from `RootLayout.module.css`.
5. Run `pnpm --filter frontend lint`; fix any issues.
6. Manually verify in `pnpm --filter frontend dev`: active state on `/races` and `/ask`, and link visibility at a narrow viewport.

## Notes for the implementer
**Out of scope:** hamburger/collapsed mobile menu, cursor hints/integration, `PageWrapper` (step 46), any link to the race detail route, new design tokens beyond what's needed for a breakpoint.

**Files likely affected:** `apps/frontend/src/components/Navbar.tsx` (new), `apps/frontend/src/components/Navbar.module.css` (new), `apps/frontend/src/components/RootLayout.tsx`, `apps/frontend/src/components/RootLayout.module.css`.

**Gotchas:**
- `NavLink`'s `className` callback in react-router v7 returns a string; conditionally compose the active class — be careful not to drop the base class when active.
- The brand title should not be a `NavLink` to a nav target unless desired; if it links anywhere, `/races` (the index redirect target) is the natural choice, but a plain non-link title is acceptable per the constraints.

**Open questions:**
- Q1 (non-blocking): Should the "Races" link appear active on the `/races/:id` detail page? `NavLink` by default treats `/races` as active for `/races/:id` unless `end` is set. Default behaviour (active on detail page) is acceptable; set `end` on the `/races` link only if the desired UX is "active on the list page only."
- Q2 (non-blocking): Is the brand title meant to be a clickable home link or static text? Spec treats it as a logo/title; static is acceptable.