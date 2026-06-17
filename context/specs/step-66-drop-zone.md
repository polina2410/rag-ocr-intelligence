# Implementation Task: DropZone Component

## What to build
A purely presentational `DropZone` component that lets the user select a single CSV file by dragging-and-dropping onto it or clicking to open a file picker. On a valid CSV it calls an `onFile` prop callback exactly once; on an invalid file it shows an inline error. It does NOT fetch, POST, own upload state, track progress, or know anything about the backend — the `/upload` page (step 67) owns all of that.

## Current state
- `apps/frontend/src/components/` holds all reusable components; there is NO upload-related component yet. `DropZone.tsx` and `DropZone.module.css` do not exist.
- `apps/frontend/src/api/http.ts` — named Axios instance `http`; no upload function yet (step 67 adds it). DropZone must not import this.
- `apps/frontend/src/components/ChatInput.tsx` — reference for conventions: named `const` arrow component, exported `interface ChatInputProps`, `disabled?: boolean` defaulting to `false`, visually-hidden `<label>` paired via `htmlFor`/`id`.
- `apps/frontend/src/components/ChatInput.module.css` — reference for `.visuallyHidden` clip pattern and `:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }` convention.
- `apps/frontend/src/index.css` `:root` defines: `--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-danger`, `--color-skeleton-highlight`, `--color-bubble-assistant-bg`, `--font-size-sm`, and badge pairs. All of these are available; do NOT add new tokens to `index.css`.
- No drag-and-drop library is installed. Use native browser APIs only (`onDragOver`, `onDragEnter`, `onDragLeave`, `onDrop`, `<input type="file">`).
- React 19 + TypeScript + CSS Modules.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/DropZone.tsx` — one component, named exports only, no default export.
2. Exported `export interface DropZoneProps` with exactly:
   - `onFile: (file: File) => void`
   - `disabled?: boolean` (defaults to `false`)
3. `export const DropZone = ({ onFile, disabled = false }: DropZoneProps) => { ... }` — no `any`.
4. New file `apps/frontend/src/components/DropZone.module.css` — all styling; no inline styles in the `.tsx`.
5. Idle state: dashed border (`var(--color-border)`) and prompt text `Drag a CSV file here, or click to select`.
6. Drag-over state: while a drag is active over the zone, border and/or background tint switch to `var(--color-accent)`. State clears on drag-leave and on drop.
7. Click-to-browse: clicking the zone triggers a hidden `<input type="file" accept=".csv">` via `useRef` + `.click()`. The input is visually hidden using the clip pattern (not `display: none`, which breaks some screen readers).
8. Keyboard support: zone has `tabIndex={0}` and opens the picker on Enter and Space (Space must `preventDefault` to avoid page scroll). Both are no-ops when `disabled` is true.
9. File validation: a file is accepted only if `file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'`. Valid → clear error, call `onFile(file)`. Invalid → set inline error, do NOT call `onFile`.
10. Multi-file drop/select: only `files[0]` is used; extras are silently ignored.
11. Error state: invalid selection renders inline text `Please select a CSV file.` in `var(--color-danger)` inside or directly below the zone. No `window.alert`.
12. Error clearing: error clears when a new drag enters the zone (`onDragEnter`) and when the file picker is opened.
13. Disabled state: `disabled={true}` → muted appearance, zone is not activatable (click/keyboard no-op, drops ignored), `aria-disabled="true"` set.
14. Accessibility: zone div has `role="button"`, `aria-label="Upload a CSV file"`, `aria-disabled` mirroring `disabled`. Hidden `<input>` has an associated visually-hidden `<label>` via `htmlFor`/`id`.
15. `pnpm --filter frontend lint` passes; no `any`, no default export, no inline styles.

## Rules that must hold
- Named exports only — `DropZoneProps` interface + `DropZone` component. No default export.
- One component per file.
- CSS Modules only — no inline styles, no Tailwind.
- Colors and font-sizes only via `var(--token)` from existing `index.css` tokens. No new tokens added.
- No `any`. Type DOM events with React generics: `DragEvent<HTMLDivElement>`, `ChangeEvent<HTMLInputElement>`, `KeyboardEvent<HTMLDivElement>`.
- Presentational only: no `import { http }`, no Axios, no upload/progress/selected state. Internal state is limited to `dragOver: boolean` and `error: string | null`.
- `onFile` fires at most once per valid selection, never for an invalid one.

## Build steps
1. Create `DropZone.module.css`:
   - `.zone` — base (dashed border `var(--color-border)`, background `var(--color-surface)`, cursor pointer, padding, border-radius, text-align center, focus-visible outline)
   - `.zoneDragOver` — modifier (border-color `var(--color-accent)`, background tint e.g. `color-mix(in srgb, var(--color-accent) 8%, transparent)`)
   - `.zoneDisabled` — modifier (opacity, cursor not-allowed)
   - `.error` — `color: var(--color-danger); font-size: var(--font-size-sm); margin-top: 8px`
   - `.prompt` — `color: var(--color-text-muted)`
   - `.visuallyHidden` — clip pattern (same as `ChatInput.module.css`)
2. Create `DropZone.tsx`. Export `DropZoneProps`. Import `useState`, `useRef`, and the CSS module.
3. Add `const inputRef = useRef<HTMLInputElement>(null)`, `const [dragOver, setDragOver] = useState(false)`, `const [error, setError] = useState<string | null>(null)`.
4. Implement `validateAndEmit(file: File | undefined)`: if falsy, return; if `.csv` extension or `text/csv` MIME → `setError(null)`, `onFile(file)`; else `setError('Please select a CSV file.')`.
5. Implement handlers:
   - `handleDragOver(e: DragEvent<HTMLDivElement>)` → `e.preventDefault()`
   - `handleDragEnter(e: DragEvent<HTMLDivElement>)` → `e.preventDefault()`, if not disabled: `setDragOver(true)`, `setError(null)`
   - `handleDragLeave` → `setDragOver(false)`
   - `handleDrop(e: DragEvent<HTMLDivElement>)` → `e.preventDefault()`, `setDragOver(false)`, if disabled return, else `validateAndEmit(e.dataTransfer.files[0])`
6. Implement `openPicker()` → if disabled, return; `setError(null)`, `inputRef.current?.click()`.
7. Implement `handleChange(e: ChangeEvent<HTMLInputElement>)` → `validateAndEmit(e.target.files?.[0])`, then `e.target.value = ''` (reset so re-selecting same file fires `onChange` again).
8. Implement `handleKeyDown(e: KeyboardEvent<HTMLDivElement>)` → if `e.key === 'Enter'` or `e.key === ' '`: `e.preventDefault()`, `openPicker()`.
9. Render:
   ```tsx
   <div
     role="button"
     aria-label="Upload a CSV file"
     aria-disabled={disabled}
     tabIndex={disabled ? -1 : 0}
     className={[styles.zone, dragOver && styles.zoneDragOver, disabled && styles.zoneDisabled].filter(Boolean).join(' ')}
     onClick={openPicker}
     onKeyDown={handleKeyDown}
     onDragOver={handleDragOver}
     onDragEnter={handleDragEnter}
     onDragLeave={handleDragLeave}
     onDrop={handleDrop}
   >
     <p className={styles.prompt}>Drag a CSV file here, or click to select</p>
     {error && <p className={styles.error}>{error}</p>}
     <label htmlFor="drop-zone-input" className={styles.visuallyHidden}>
       Upload CSV file
     </label>
     <input
       id="drop-zone-input"
       ref={inputRef}
       type="file"
       accept=".csv"
       className={styles.visuallyHidden}
       onChange={handleChange}
       disabled={disabled}
     />
   </div>
   ```
10. Run `pnpm --filter frontend lint` and fix any issues. Run `pnpm --filter frontend build`.

## Notes for the implementer
- **Out of scope:** no `POST /ingest/csv`, no progress bar, no success/redirect, no Axios, no "selected file" preview, no "uploading" state, no size-limit validation, no multi-file support. All of that is step 67.
- **Files affected:** new `DropZone.tsx` and `DropZone.module.css` only. No existing files are modified (step 67 will import the component).
- **`onDragOver` must call `preventDefault()`** or the browser will not fire the `drop` event — this is the most common drag-and-drop bug.
- **Reset input value** after each change (`e.target.value = ''`) so selecting the same file a second time still fires `onChange`.
- **CSV MIME type inconsistency:** some browsers report `application/vnd.ms-excel` or `''` for CSV files, so the `.csv` extension check is the primary gate; the `text/csv` MIME check is a fallback, not the sole criterion.
- **Drag-enter/leave flicker:** `onDragEnter`/`onDragLeave` fire for child elements too, which can cause `dragOver` to flicker. Keeping inner content minimal (just `<p>` tags and the hidden input) minimises this; minor flicker is acceptable for the MVP.
- **`tabIndex` when disabled:** use `tabIndex={disabled ? -1 : 0}` so the zone is removed from the tab order when disabled, matching native button behaviour.