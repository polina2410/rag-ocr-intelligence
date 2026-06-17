# Implementation Task: /upload Page

## What to build
A routed `/upload` page that lets a user upload a race-results CSV. It composes the existing `DropZone`, drives an upload-progress bar and error feedback through a small state machine, and on success navigates to `/races/:id` for the newly created race. A new `api/ingest.ts` layer wraps the `POST /ingest/csv` call.

## Current state
- `apps/frontend/src/components/DropZone.tsx` — emits `onFile(file)` once for a valid CSV; accepts `disabled?: boolean`. Owns no upload state. DO NOT MODIFY.
- `apps/frontend/src/api/http.ts` — exports `http` Axios instance (baseURL from `VITE_API_URL`).
- `apps/frontend/src/api/races.ts` — exports `getRaces`, `getRace` only. No upload function.
- `apps/frontend/src/router.tsx` — lazy routes for `/races`, `/races/:id`, `/ask`. Already has `/* eslint-disable react-refresh/only-export-components */` at top. `/upload` is NOT yet present.
- `apps/frontend/src/components/PageWrapper.tsx` — centers content at max-width 1200px.
- `apps/frontend/src/pages/RacesPage.tsx` — reference page convention: `const X = () => {...}; export default X`, wraps body in `<PageWrapper>` with an `<h1>`.
- Backend `POST /ingest/csv`: `multipart/form-data`, field name `"file"`. 201 → `{ raceId: string; rowsIngested: number }`. Errors 400/422/500 → NestJS shape `{ statusCode, message, error }` where `message` is a string OR a `string[]`.
- `react-router-dom` (`useNavigate`), TanStack Query, Axios — all available. No progress library installed.

## Deliverables (definition of done)
1. NEW `apps/frontend/src/api/ingest.ts` exporting:
   `export const uploadCsv = (file: File, onProgress?: (pct: number) => void): Promise<{ raceId: string; rowsIngested: number }>`
   - Builds `FormData` with field name exactly `"file"`.
   - Calls `http.post('/ingest/csv', formData, { onUploadProgress })`.
   - In `onUploadProgress`, computes integer percent from `event.loaded / event.total * 100` and calls `onProgress(pct)` only when `event.total` is defined and `onProgress` is provided.
   - Returns `res.data`. No try/catch — errors propagate to the caller.
2. NEW `apps/frontend/src/pages/UploadPage.tsx`:
   - `const UploadPage = () => {...}` with `export default UploadPage`.
   - State: `status: 'idle' | 'uploading' | 'error'` (default `'idle'`), `progress: number` (default `0`), `errorMsg: string | null` (default `null`).
   - Renders inside `<PageWrapper>`: `<h1>Upload Race Data</h1>`, then `<DropZone>`, then conditionally a progress bar or an error message.
   - `<DropZone onFile={handleFile} disabled={status === 'uploading'} />`.
   - `handleFile(file)`: set `status='uploading'`, `progress=0`, `errorMsg=null`; call `uploadCsv(file, setProgress)`; on resolve call `navigate(\`/races/${data.raceId}\`)`; on reject extract the error message and set `status='error'`, `errorMsg=<extracted>`.
   - Progress bar renders ONLY when `status === 'uploading'`: a track `<div>` containing a fill `<div>` whose width is driven by the `--pct` CSS custom property. Has `role="progressbar"`, `aria-valuenow={progress}`, `aria-valuemin={0}`, `aria-valuemax={100}`. Displays numeric label e.g. `{progress}%`.
   - Error message renders ONLY when `status === 'error'`: text in `var(--color-danger)` with `role="alert"`.
3. NEW `apps/frontend/src/pages/UploadPage.module.css` — styles for heading/layout, progress track, progress fill (width via `var(--pct)`), and error text. All colors and font-sizes via `var(--token)` only.
4. EDIT `apps/frontend/src/router.tsx`:
   - Add `const UploadPage = lazy(() => import('./pages/UploadPage'))`.
   - Add `{ path: '/upload', element: <UploadPage /> }` as a child route under the `RootLayout` route alongside the existing three routes.
5. Error extraction: given an unknown thrown value, return a display string — if `axios.isAxiosError(err)` and `err.response.data.message` is a string → that string; if it is a `string[]` → joined with `'; '`; otherwise `'Upload failed. Please try again.'`. May live as a module-level function in `UploadPage.tsx`.
6. `pnpm --filter frontend lint` passes and `pnpm --filter frontend build` succeeds. Zero `any` types.

## Rules that must hold
- HTTP only via the `http` Axios instance from `api/http.ts`. No `fetch`, no inline `axios.create`.
- CSS Modules only — no inline styles except the single `style={{ '--pct': \`${progress}%\` }}` on the progress fill element (necessary because width is data-driven and cannot be expressed as a static CSS class). All colors/font-sizes come from `var(--token)`.
- Page component uses `export default`; `uploadCsv` uses a named `export const`.
- No `any`. Narrow the Axios error with `axios.isAxiosError(err)` before accessing `err.response`.
- Do NOT modify `DropZone.tsx`, `Navbar.tsx`, `http.ts`, `races.ts`, or `PageWrapper.tsx`.
- FormData field name must be exactly `"file"` to match the backend `FileInterceptor('file', ...)`.

## Build steps
1. Create `apps/frontend/src/api/ingest.ts` with `uploadCsv` (FormData, `onUploadProgress` → integer percent, return body typed `{ raceId: string; rowsIngested: number }`).
2. Write the `extractErrorMessage(err: unknown): string` helper in `UploadPage.tsx`.
3. Create `UploadPage.module.css` (layout, `.progressTrack`, `.progressFill { width: var(--pct) }`, `.error`).
4. Create `UploadPage.tsx` with the three-field state, `useNavigate`, DropZone wiring, and conditional progress/error rendering.
5. Edit `router.tsx`: add lazy import + `/upload` child route under `RootLayout`.
6. Run `pnpm --filter frontend lint` and fix any issues. Run `pnpm --filter frontend build`.

## Notes for the implementer
- **Out of scope:** Navbar link to `/upload` (not in step 67 — do not touch `Navbar.tsx`); intermediate success screen (redirect immediately, do not display `rowsIngested`); client-side size limits, retry/cancel UI, multi-file upload.
- **Files changed:** NEW `api/ingest.ts`, NEW `pages/UploadPage.tsx`, NEW `pages/UploadPage.module.css`, EDIT `router.tsx`. No other files.
- **Progress tail:** `onUploadProgress` tracks bytes sent to the server, not server processing time. The bar may reach 100% and hold there while the backend parses and saves the CSV. Leave `status='uploading'` until the promise resolves/rejects — this is acceptable MVP behaviour.
- **`event.total` guard:** `total` can be `undefined` in some environments; always guard `if (event.total)` before computing percent.
- **Error → re-enable:** after `status='error'`, `DropZone` becomes active again (`disabled={false}`). A new `onFile` must immediately reset `progress=0`, `errorMsg=null`, and `status='uploading'` before calling `uploadCsv` again.
- **`string[]` message:** NestJS class-validator errors return `message` as an array; the extractor must handle both branches.
- **`style` prop for `--pct`:** TypeScript may complain about unknown CSS custom properties in the style object. Cast as `React.CSSProperties` or use `{ style: { ['--pct']: \`${progress}%\` } as React.CSSProperties }`.