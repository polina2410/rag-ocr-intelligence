# Implementation Task: Magnifier Mode (Step 74)

## What to build
A `CursorMagnifier` component that renders a 200x200 `<canvas>` near the cursor showing a 2x-zoomed crop of the page, activated when the cursor is over any element marked `data-cursor-magnifier="true"`. Activation is driven by a new `'hover'` value on the existing `CursorMode` (currently reserved/unused). The zoom source comes from a one-time `html2canvas-pro` snapshot of `document.body` taken at activation, not a per-frame recapture.

## Current state
- `apps/frontend/src/context/CursorContext.tsx` — `CursorProvider` listens to `mousemove`, computes `{ x, y, hint, mode }`. `CursorMode = 'default' | 'hover' | 'pointer'`. `'pointer'` set via `target.closest(INTERACTIVE_SELECTOR)` where `INTERACTIVE_SELECTOR = 'a, button, [role="button"], [tabindex]'`. `'hover'` is currently NEVER set. `hint` read from `data-cursor-hint` via `closest()`.
- `apps/frontend/src/hooks/useCursor.ts` — `useCursor(): CursorContextValue`, thin `useContext` wrapper.
- `apps/frontend/src/components/CursorDot.tsx` + `.module.css` — `motion.div`, `z-index: 9999`, `position: fixed`, `pointer-events: none`. Already has a `SHAPES.hover` entry (currently identical to `default`).
- `apps/frontend/src/components/CursorHint.tsx` + `.module.css` — tooltip, `z-index: 9998`.
- `apps/frontend/src/components/RootLayout.tsx` — mounts `<CursorProvider>` wrapping `<CursorDot />`, `<CursorHint />`, `<Navbar />`, routed `<Outlet />`.
- `apps/frontend/src/index.css` `:root` tokens available: `--color-border` (used for the magnifier border), `--color-surface`, `--color-accent`, etc. `body { cursor: none; }` is already set.
- Stack: React 19, TypeScript (strict, no `any`), Vite 8, framer-motion 12, CSS Modules only. No screenshot/canvas-capture library installed yet.

## Dependency to install
Add `html2canvas-pro` as a runtime dependency of the `frontend` workspace (`pnpm --filter frontend add html2canvas-pro`). Use `html2canvas-pro` (not the original `html2canvas`) — it is the maintained fork and compatible with modern CSS color functions. It ships its own types; no `@types/*` package needed.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/CursorMagnifier.tsx` exporting a named `const CursorMagnifier` (arrow function, no default export).
2. New file `apps/frontend/src/components/CursorMagnifier.module.css` (CSS Modules; colors/font-sizes via `var(--token)` only).
3. `CursorContext.tsx` updated so `mode` becomes `'hover'` when the cursor is over a `[data-cursor-magnifier]` element (detected via `closest()`), with the precedence rule below.
4. `RootLayout.tsx` mounts `<CursorMagnifier />` inside `<CursorProvider>` alongside `<CursorDot />` and `<CursorHint />`.
5. `pnpm --filter frontend lint` passes; project type-checks with no `any`.

## CursorContext change (deliverable 3 detail)
- Add a constant `const CURSOR_MAGNIFIER_ATTR = 'data-cursor-magnifier'`.
- In `handleMouseMove`, after computing `hint`, determine mode with this priority:
  1. If `target.closest('[data-cursor-magnifier]')` matches → `mode = 'hover'`.
  2. Else if `target.closest(INTERACTIVE_SELECTOR)` matches → `mode = 'pointer'`.
  3. Else → `mode = 'default'`.
  Magnifier wins when an element is both interactive AND magnifiable.
- The non-`Element` target branch keeps `mode: 'default'`.

## CursorMagnifier component (deliverable 1+2 detail)
- Reads `{ x, y, mode }` from `useCursor()`.
- Holds a `useRef<HTMLCanvasElement | null>` for the visible canvas (the rendered DOM `<canvas>`) and a `useRef<HTMLCanvasElement | null>` for the captured snapshot.
- Capture flow:
  - On transition INTO `mode === 'hover'` (detect edge, not every render): call `html2canvas-pro`'s default export on `document.body`, await the returned `HTMLCanvasElement`, store it in the snapshot ref. Guard against the mode having changed away from `'hover'` by the time the async capture resolves — do not draw a stale snapshot if no longer hovering.
  - While `mode === 'hover'` and a snapshot exists: on each `{ x, y }` change, get the visible canvas 2D context and `drawImage(snapshot, srcX, srcY, srcW, srcH, 0, 0, CANVAS_SIZE, CANVAS_SIZE)` where the source crop is centered on the cursor.
  - On transition OUT of `'hover'`: clear the snapshot ref (set to `null`).
- Rendering: render the `<canvas width={200} height={200}>` only while `mode === 'hover'`. Position it `fixed` at `left: x + OFFSET`, `top: y - CANVAS_SIZE - OFFSET` (20px right, 20px above the cursor). Framer Motion is optional for fade; a plain conditional render is acceptable.

## Visual spec (named constants, no magic numbers)
- `CANVAS_SIZE = 200` (px, both width and height).
- `ZOOM = 2`; `SRC_SIZE = CANVAS_SIZE / ZOOM = 100` (source crop is 100×100).
- `OFFSET = 20` (px right and up from cursor).
- Source crop math (account for device pixel ratio of the captured canvas):
  - Recommendation: pass an explicit `scale: 1` option to `html2canvas-pro` to make the math deterministic. Then `srcX = x - SRC_SIZE / 2`, `srcY = (y + window.scrollY) - SRC_SIZE / 2`, `srcW = srcH = SRC_SIZE`. Clamp `srcX`/`srcY` to `>= 0` and within snapshot bounds.
  - Add `window.scrollY`/`window.scrollX` when mapping cursor position into the snapshot — the capture is in document coordinates, cursor position is in viewport coordinates.
- CSS for the canvas: `position: fixed; border: 1px solid var(--color-border); border-radius: 8px; z-index: 9997; pointer-events: none;` (below CursorDot 9999 and CursorHint 9998). Use a CSS Modules class; `left`/`top` set via inline `style` (positional values only, matching existing CursorDot/CursorHint pattern).

## Rules that must hold
- Component convention: named `const CursorMagnifier = () => {...}`, no default export, one component per file, co-located `.module.css`.
- No inline styles except dynamic positional `left`/`top` (matches existing CursorDot/CursorHint pattern). All colors/radii/borders live in `.module.css` via `var(--token)`.
- No `any`; strict TypeScript. Type the snapshot and canvas refs as `HTMLCanvasElement | null`.
- Do not recapture per frame — capture once per hover activation.
- Do not introduce new `:root` tokens; `--color-border` already exists.

## Build steps
1. `pnpm --filter frontend add html2canvas-pro`.
2. Edit `CursorContext.tsx`: add `CURSOR_MAGNIFIER_ATTR`; implement 3-tier mode priority (magnifier > interactive > default).
3. Create `CursorMagnifier.module.css` with the `.canvas` class (border, radius, z-index, pointer-events, position fixed).
4. Create `CursorMagnifier.tsx`: refs, edge-detection effect for capture on hover-in, draw effect on `{x,y}` change, cleanup on hover-out, conditional canvas render with positional inline style.
5. Edit `RootLayout.tsx`: import and mount `<CursorMagnifier />` inside `<CursorProvider>`.
6. Run `pnpm --filter frontend lint` and type-check; fix any issues.
7. (Optional smoke test) Add `data-cursor-magnifier="true"` to a chart or race card to verify the magnifier appears on hover.

## Notes for the implementer

**Files to create or edit:**
- CREATE `apps/frontend/src/components/CursorMagnifier.tsx`
- CREATE `apps/frontend/src/components/CursorMagnifier.module.css`
- EDIT `apps/frontend/src/context/CursorContext.tsx`
- EDIT `apps/frontend/src/components/RootLayout.tsx`
- EDIT `apps/frontend/package.json` (new dependency via pnpm)

**Known risks:**
- `html2canvas-pro(document.body)` is async and can take 100ms–1s+ on a complex page. There will be a perceptible delay between hover start and the magnifier showing its first frame. Acceptable for MVP.
- Guard the capture promise against a race: if `mode` left `'hover'` before the promise resolves, discard the result.
- Scroll offset: add `window.scrollY`/`window.scrollX` when mapping cursor position into the snapshot coordinate space — this is the most likely source of visual offset bugs.
- html2canvas-pro limitation: cross-origin images, `<iframe>`, `<video>`, and WebGL content will not render correctly in the snapshot. Known and accepted.

**Out of scope for this step:**
- Live/real-time re-rendering as page content changes (snapshot goes slightly stale — acceptable).
- Touch/mobile support (cursor engine is pointer-only).
- Configurable zoom level or magnifier size via props.
- Adding `data-cursor-magnifier` to real feature components (charts, race cards) — that can be done as a follow-up.
