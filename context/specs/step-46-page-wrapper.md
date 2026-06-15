# Implementation Task: PageWrapper Component

## What to build
A `PageWrapper` layout component that constrains its `children` to a centred content column with a fixed max-width and consistent horizontal padding. It is consumed by page components (`RacesPage`, `RaceDetailPage`, `AskPage`) to give every route a uniform content width — it is not part of the `RootLayout` shell.

## Current state
- `apps/frontend/src/components/RootLayout.tsx` — renders `<Navbar />` then `<Outlet />` inside `<ErrorBoundary><Suspense>`. The `<Outlet />` renders with no content width constraint or page padding. Do NOT modify this file.
- `apps/frontend/src/components/RootLayout.module.css` — `.layout { min-height: 100vh; display: flex; flex-direction: column; }`. No content width constraint.
- `apps/frontend/src/index.css` — defines `:root { --color-accent: #6366f1; --color-border: #e5e7eb; }`, `box-sizing: border-box` globally, `body { margin: 0; font-family: system-ui, sans-serif; }`. No max-width or padding tokens.
- Pages `RacesPage`, `RaceDetailPage`, `AskPage` (`apps/frontend/src/pages/*.tsx`) are placeholder stubs with no styling. Pages use `export default`; components use named exports.
- No `PageWrapper` component exists yet.
- Conventions (confirmed from `Navbar.tsx`): named `const` arrow function, named export, one component per file, CSS Modules imported as `styles` from a sibling `.module.css`, no inline styles, no Tailwind.
- Versions: React 19.2.6, TypeScript ~6.0.2, Vite 8, React Router DOM v7.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/PageWrapper.tsx` exporting a named `const` arrow component `PageWrapper`.
2. `PageWrapper` accepts exactly one prop: `children: ReactNode`. No other props (no `className`, no `as`, etc.) for this step.
3. `PageWrapper` renders a single wrapping element with the CSS Module class applied, containing `{children}`.
4. New file `apps/frontend/src/components/PageWrapper.module.css` containing the wrapper class.
5. The wrapper class sets a content max-width of `1200px`, centres the column horizontally (`margin-inline: auto`), and applies consistent horizontal padding. The max-width value lives locally in this file — no new global token added to `index.css`.
6. `pnpm --filter frontend lint` passes; no TypeScript errors; no `any` types.

## Rules that must hold
- Do NOT modify `RootLayout.tsx`, `RootLayout.module.css`, or `index.css`.
- No inline styles — all styling via the CSS Module only.
- No `any` types; type `children` as `ReactNode` imported from `react`.
- Named export (`export const PageWrapper`) — do not use a default export.
- No new global CSS variable in `:root`; keep the max-width value local to `PageWrapper.module.css`.
- Do not wire `PageWrapper` into any page yet — adoption is deferred to steps 53, 59, and the `/ask` page.

## Build steps
1. Create `apps/frontend/src/components/PageWrapper.module.css` with a single `.wrapper` class: `max-width: 1200px`, `margin-inline: auto`, and horizontal padding (e.g. `padding-inline: 24px`).
2. Create `apps/frontend/src/components/PageWrapper.tsx`: import `ReactNode` from `react` and `styles` from `./PageWrapper.module.css`; define and export `PageWrapper = ({ children }: { children: ReactNode }) => <div className={styles.wrapper}>{children}</div>`.
3. Run `pnpm --filter frontend lint`; fix any issues.

## Notes for the implementer
**Out of scope:** wiring `PageWrapper` into pages, a `className` escape-hatch prop, vertical padding, responsive breakpoints beyond the fixed padding, global token extraction.

**Files affected:** `PageWrapper.tsx` (new), `PageWrapper.module.css` (new). No existing files modified.

**Open questions (non-blocking):**
- Q1: Semantic element — `<div>` is safe; `<main>` is reasonable since `RootLayout` does not use `<main>`, but verify no other component already claims the `<main>` landmark before using it.
- Q2: Exact horizontal padding value is unspecified; `24px` is a sensible default. Adjust if design specifies otherwise.