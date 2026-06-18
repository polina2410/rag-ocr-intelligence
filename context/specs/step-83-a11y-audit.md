# Implementation Task: A11y Audit — WCAG AA Fixes

## What to build
Apply 20 targeted accessibility fixes identified by static code review across the frontend. Changes fall into four categories: landmark/semantic HTML, keyboard navigation, live regions / ARIA, and reduced-motion guards. No new components; one new hook. Out of scope: `RaceCard` full restructure (button-outside-link), `--color-text-muted` contrast token change (borderline, design decision), `cursor: none` global guard (existing per-component `:focus-visible` rules compensate).

## Current state
- `apps/frontend/src/components/PageWrapper.tsx` — renders `<div>`, not `<main>`
- `apps/frontend/src/pages/AskPage.tsx` — renders `<div className={styles.page}>`, not `<main>`; no `<h1>`
- `apps/frontend/src/components/Navbar.tsx:6` — brand is `<span>OCR Intelligence</span>`, not a link
- `apps/frontend/src/components/RaceCard.tsx` — delete button only visible on hover (`hovered` state from mouse events only); delete-fail `<p>` has no `role="alert"`
- `apps/frontend/src/components/ChatHistory.module.css` — scroll container has no `aria-live`
- `apps/frontend/src/components/RouteFallback.tsx` — spinner `<div>` has no role or label; animation unguarded
- `apps/frontend/src/components/CursorMagnifier.tsx:58` — `<canvas>` not `aria-hidden`
- `apps/frontend/src/components/SourceCitations.tsx:29` — `aria-label` on `<li>` (suppresses child text for screen readers)
- `apps/frontend/src/components/DropZone.tsx:91` — error `<p>` has no `role="alert"`
- `apps/frontend/src/components/ErrorBoundary.module.css` — `.button` has no `:focus-visible`
- `apps/frontend/src/components/CursorHint.tsx` — Framer Motion y-animation not guarded by `useReducedMotion`
- `apps/frontend/src/components/CursorDot.tsx` — Framer Motion animate not guarded by `useReducedMotion`
- `apps/frontend/src/components/ObstacleSplitChart.tsx` + `PenaltyRateChart.tsx` — chart wrappers have no `aria-label`
- `apps/frontend/src/pages/RacesPage.tsx` — error `<p>` has no `role="alert"`
- `apps/frontend/src/pages/UploadPage.tsx` — `role="progressbar"` on invisible outer `<div>`; inner `.progressTrack` is the visual element
- Skeleton animations missing `prefers-reduced-motion`: `SkeletonCard.module.css`, `SkeletonTable.module.css`, `SkeletonChart.module.css`, `RaceCardStats.module.css`, `RouteFallback.module.css`
- No route-change focus management (React Router v6 does not move focus automatically)
- `apps/frontend/src/hooks/` — no `useFocusOnRouteChange` hook exists

## Deliverables (definition of done)
1. `PageWrapper` renders `<main>` instead of `<div>`. `AskPage` renders `<main>` instead of `<div className={styles.page}>`.
2. `Navbar` brand is `<Link to="/races">OCR Intelligence</Link>` (keyboard-reachable, announces destination).
3. `RaceCard` delete button is visible on both hover AND keyboard focus (`:focus-within` or `onFocus`/`onBlur`).
4. `RaceCard` delete-fail error `<p>` has `role="alert"`.
5. `ChatHistory` scroll container (`<div className={styles.scroll}>`) has `aria-live="polite"` and `aria-atomic="false"`.
6. `AskPage` has a visually-hidden `<h1>Ask AI</h1>` as the first element inside `<main>`.
7. `RouteFallback` spinner has `role="status"` and `aria-label="Loading page"`.
8. `CursorMagnifier` `<canvas>` has `aria-hidden="true"`.
9. `SourceCitations` `<li>` elements do not have `aria-label`.
10. `DropZone` error `<p>` has `role="alert"`.
11. `RacesPage` error `<p>` has `role="alert"`.
12. `ErrorBoundary.module.css` `.button` has a `:focus-visible` rule.
13. `CursorHint` y-animation values are `0` when `useReducedMotion()` returns true.
14. `CursorDot` transition `duration` is `0` when `useReducedMotion()` returns true.
15. `ObstacleSplitChart` and `PenaltyRateChart` wrapper divs have `role="img"` and `aria-label` describing the chart.
16. `UploadPage` `role="progressbar"` (and its `aria-*` attributes) are on `<div className={styles.progressTrack}>`, not the outer wrapper `<div>`.
17. Five CSS modules have `@media (prefers-reduced-motion: reduce) { animation: none }`: `SkeletonCard`, `SkeletonTable`, `SkeletonChart`, `RaceCardStats`, `RouteFallback`.
18. A `useFocusOnRouteChange` hook exists in `apps/frontend/src/hooks/useFocusOnRouteChange.ts` and is called in `RootLayout`. After each route change, focus moves to the page's first `<h1>` (or `<main>` as fallback).
19. `pnpm --filter frontend lint` passes.
20. `pnpm --filter frontend build` succeeds.

## Rules that must hold
- No inline styles (except existing Framer Motion `style={{ y: motionValue }}` bindings).
- All CSS changes go in `.module.css` files or `index.css`; no Tailwind.
- Do not break existing `:focus-visible` rules already in place.
- Visually-hidden text must use the pattern `position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap` — do not rely on `opacity: 0` or `display: none` (those hide from screen readers too).
- `<main>` must appear exactly once per page — confirm `PageWrapper` and `AskPage` are the only `<main>` elements (no double-wrapping).
- `useReducedMotion` is from `framer-motion` — already a dependency, no new install needed.
- RaceCard delete-button nesting inside `<Link>` is NOT fixed in this step (deferred restructure); only keyboard discoverability and the error live region are addressed here.

## Build steps

### Group A — Landmark / semantic HTML (3 files)
1. **`PageWrapper.tsx`** — change `<div className={styles.wrapper}>` → `<main className={styles.wrapper}>` (and the closing tag).
2. **`AskPage.tsx`** — change `<div className={styles.page}>` → `<main className={styles.page}>` (and closing tag). Add `<h1 className={styles.visuallyHidden}>Ask AI</h1>` as the first child inside `<main>`. Add `.visuallyHidden` to `AskPage.module.css`:
   ```css
   .visuallyHidden {
     position: absolute;
     width: 1px;
     height: 1px;
     overflow: hidden;
     clip: rect(0, 0, 0, 0);
     white-space: nowrap;
   }
   ```
3. **`Navbar.tsx`** — replace `<span className={styles.brand}>OCR Intelligence</span>` with `<Link to="/races" className={styles.brand}>OCR Intelligence</Link>`. Add `import { Link, NavLink } from 'react-router-dom'` if `Link` is not already imported (check existing import — `NavLink` is used; add `Link` to the same destructure).

### Group B — Keyboard navigation (1 file)
4. **`RaceCard.tsx`** — the `hovered` state currently uses only `onMouseEnter`/`onMouseLeave`. Add `onFocus` and `onBlur` handlers to the `<Link>` element that also set `hovered`:
   ```tsx
   onFocus={() => setHovered(true)}
   onBlur={() => setHovered(false)}
   ```
   This makes the delete button visible when the card receives keyboard focus. Also add `role="alert"` to the delete-fail error paragraph:
   ```tsx
   {mutation.isError && (
     <p role="alert" className={styles.deleteError}>Failed to delete race.</p>
   )}
   ```

### Group C — Live regions and ARIA (7 files)
5. **`ChatHistory.tsx`** — add `aria-live="polite"` and `aria-atomic="false"` to `<div className={styles.scroll}>`.
6. **`RouteFallback.tsx`** — add `role="status"` and `aria-label="Loading page"` to the outer `<div>` that wraps the spinner.
7. **`CursorMagnifier.tsx`** — add `aria-hidden="true"` to the `<canvas>` element.
8. **`SourceCitations.tsx`** — remove the `aria-label={citation.label ?? citation.text}` attribute from the `<li>` element. Child `<p>` text content is sufficient.
9. **`DropZone.tsx`** — add `role="alert"` to the error `<p className={styles.error}>`.
10. **`RacesPage.tsx`** — add `role="alert"` to `<p>Failed to load races.</p>`.
11. **`UploadPage.tsx`** — move `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, and `aria-label` from the outer wrapper `<div>` to the inner `<div className={styles.progressTrack}>`. The outer `<div>` becomes a plain `<div>`.
12. **`ObstacleSplitChart.tsx`** — wrap `<ResponsiveContainer>` in a `<div role="img" aria-label="Bar chart: average split time per obstacle in seconds">`. Same pattern for **`PenaltyRateChart.tsx`**: `aria-label="Bar chart: penalty rate per obstacle"`.

### Group D — Reduced motion (5 CSS files + 2 TSX files)
13. Append to **`SkeletonCard.module.css`**:
    ```css
    @media (prefers-reduced-motion: reduce) {
      .shimmer { animation: none; }
    }
    ```
14. Same pattern for **`SkeletonTable.module.css`**, **`SkeletonChart.module.css`**, **`RaceCardStats.module.css`** (class name is `.shimmerBlock` / `.shimmer` — check actual name in each file).
15. Append to **`RouteFallback.module.css`** — check the spinner class name and add:
    ```css
    @media (prefers-reduced-motion: reduce) {
      .spinner { animation: none; }
    }
    ```
16. **`ErrorBoundary.module.css`** — append:
    ```css
    .button:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
    ```
17. **`CursorHint.tsx`** — add `import { useReducedMotion } from 'framer-motion'` and:
    ```tsx
    const shouldReduceMotion = useReducedMotion()
    // In the motion.div props:
    initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: shouldReduceMotion ? 0 : 4 }}
    ```
18. **`CursorDot.tsx`** — add `import { useReducedMotion } from 'framer-motion'` and pass `transition={{ duration: shouldReduceMotion ? 0 : TRANSITION_DURATION }}` to the `motion.div`.

### Group E — Route focus management (1 new file + 1 existing file)
19. Create **`apps/frontend/src/hooks/useFocusOnRouteChange.ts`**:
    ```ts
    import { useEffect } from 'react'
    import { useLocation } from 'react-router-dom'

    export const useFocusOnRouteChange = (): void => {
      const { pathname } = useLocation()
      useEffect(() => {
        const h1 = document.querySelector<HTMLElement>('h1')
        if (h1) {
          h1.tabIndex = -1
          h1.focus()
        }
      }, [pathname])
    }
    ```
20. **`RootLayout.tsx`** — call `useFocusOnRouteChange()` inside the component body. Add the import.

### Group F — Quality gates
21. Run `pnpm --filter frontend lint` — fix any errors.
22. Run `pnpm --filter frontend build` — fix any TypeScript errors.

## Notes for the implementer
- **`<main>` uniqueness**: after step 1, `PageWrapper` renders `<main>`. `AskPage` does not use `PageWrapper`, so it must render its own `<main>`. Confirm `RaceDetailPage` and `UploadPage` both use `PageWrapper` (they do — no change needed there).
- **Navbar `Link` import**: check `Navbar.tsx` — it already imports `NavLink`; add `Link` to the same `react-router-dom` destructure. The existing `.brand` CSS class applies fine to both `<span>` and `<Link>`.
- **`RaceCard` `onFocus`/`onBlur`**: the `<Link>` renders as `<a>`. Focus bubbles from child elements (including the delete button itself), so `onFocus` will fire when tab moves into the card AND when the button inside it is tabbed to. `onBlur` fires when focus leaves the card entirely. This is the correct behavior — the button stays visible while focus is anywhere inside the card.
- **Skeleton animation class names**: verify exact class names in each file before adding the media query — `SkeletonCard` uses `.shimmer` on the `<div>`, `SkeletonTable` may use `.cell` or `.shimmer`, `SkeletonChart` uses `.shimmer`, `RaceCardStats` uses `.shimmerBlock`.
- **`useFocusOnRouteChange`**: the `h1.tabIndex = -1` is necessary because HTML headings are not normally focusable programmatically. The `tabIndex` assignment is ephemeral (it does not add a tab stop for keyboard users). Do NOT add a permanent `tabIndex` attribute to `<h1>` elements in TSX — only set it dynamically in the hook.
- **Chart `aria-label` placement**: wrap `<ResponsiveContainer>` in a `<div>` — do not put `role`/`aria-label` on `<ResponsiveContainer>` directly (it passes unknown props through to the wrapper `<div>`, which may cause lint warnings).
- **`UploadPage` progressbar**: confirm the current structure then move attributes carefully — `aria-valuenow={uploadProgress}` must remain a dynamic prop driven by state.
