# Implementation Task: Step 78 — API Client Audit (axios setup + VITE_API_URL)

## What to build
Consolidate the frontend API base-URL configuration so it is defined once, typed explicitly, and documented for onboarding. Export a shared `API_URL` constant from the axios layer, consume it in the SSE `ask.ts` module, declare `VITE_API_URL` in a typed `ImportMetaEnv` interface, and add a frontend `.env.example`.

## Current state
- `apps/frontend/src/api/http.ts` — exports an axios instance `http` with `baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`. The fallback string is inline.
- `apps/frontend/src/api/ask.ts` — SSE streaming via native `fetch` (correct, must stay). Line 1 duplicates `const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`. Uses `fetch(\`${API_URL}/ask\`, ...)`.
- `apps/frontend/src/api/races.ts` — imports `http` from `./http`, uses `http.get` / `http.delete`. No change needed.
- `apps/frontend/src/api/ingest.ts` — imports `http` from `./http`, uses `http.post`. No change needed.
- `apps/frontend/.env` — contains `VITE_API_URL=http://localhost:3000` (gitignored runtime file).
- `apps/frontend/tsconfig.app.json` — `"types": ["vite/client", "react", "react-dom"]`; `import.meta.env.VITE_API_URL` resolves to `string | undefined` via Vite's default index signature only.
- No `vite-env.d.ts` exists anywhere in `apps/frontend/` — there is no custom `ImportMetaEnv` augmentation.
- No `apps/frontend/.env.example` exists.

## Deliverables (definition of done)
1. `apps/frontend/src/api/http.ts` exports a named constant `API_URL: string` holding `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`, and the axios instance's `baseURL` references that constant. The literal default URL appears exactly once in the codebase.
2. `apps/frontend/src/api/ask.ts` imports `API_URL` from `./http` and removes its local `const API_URL = ...` declaration. The default-URL literal no longer appears in `ask.ts`. SSE still uses native `fetch` (unchanged behavior).
3. `apps/frontend/src/vite-env.d.ts` (new file) contains `/// <reference types="vite/client" />` and declares an `ImportMetaEnv` interface with `readonly VITE_API_URL: string` plus the matching `ImportMeta { readonly env: ImportMetaEnv }`. After this, `import.meta.env.VITE_API_URL` types as `string` (not `string | undefined`).
4. `apps/frontend/.env.example` (new file) exists, is committed (not gitignored), and contains `VITE_API_URL=http://localhost:3000` with a one-line comment describing it.
5. `pnpm --filter frontend lint` passes.
6. `pnpm --filter frontend build` succeeds (type-check clean).

## Rules that must hold
- The default-URL fallback literal `'http://localhost:3000'` must exist in exactly ONE place across the api layer (in `http.ts`).
- `ask.ts` MUST keep using native `fetch` for SSE — do not route it through the axios instance.
- No `any` types. The `ImportMetaEnv` member must be a concrete `string`.
- `.env.example` must NOT contain real secrets (this var has none — safe).
- `apps/frontend/.env` (runtime) stays gitignored and unchanged.
- Backward compatible: existing callers of `http`, `getRaces`, `getRace`, `deleteRace`, `uploadCsv`, `streamAsk` keep working with no signature changes.
- No new files beyond `vite-env.d.ts` and `.env.example`.

## Build steps
1. In `http.ts`, extract the base URL into an exported named constant `API_URL` and have `axios.create({ baseURL: API_URL })` reference it. Keep the `?? 'http://localhost:3000'` fallback on that constant only.
2. In `ask.ts`, delete the local `const API_URL = ...` and add `import { API_URL } from './http'` at the top (value import, not `import type`). Leave the rest of the SSE logic untouched.
3. Create `apps/frontend/src/vite-env.d.ts` with the `vite/client` reference and an `ImportMetaEnv` / `ImportMeta` augmentation declaring `readonly VITE_API_URL: string`.
4. Create `apps/frontend/.env.example` with a commented `VITE_API_URL=http://localhost:3000` entry.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any type/lint fallout.

## Notes for the implementer
- **Gotcha:** `tsconfig.app.json` already lists `vite/client` in `types`, so Vite's ambient types are active. Adding a custom `ImportMetaEnv` interface *narrows* `VITE_API_URL` from `string | undefined` to `string` via declaration merging — verify the `///` reference line is present so the `vite/client` base types are not lost.
- **Gotcha:** `verbatimModuleSyntax: true` is on. `API_URL` is a runtime value, so use a regular `import`, not `import type`.
- **Edge case:** Once `VITE_API_URL` is typed as non-optional `string`, the `?? 'http://localhost:3000'` fallback is technically redundant per the type checker — keep it anyway as a defensive runtime default (the type assumes the env var is always set at build time, which `.env.example` enforces by convention, not guarantee).
- **Out of scope:** changing CORS, adding axios interceptors, request/response error normalization, retry logic, or auth headers. This step is configuration consolidation only.
- Files affected: `apps/frontend/src/api/http.ts` (edit), `apps/frontend/src/api/ask.ts` (edit), `apps/frontend/src/vite-env.d.ts` (new), `apps/frontend/.env.example` (new).
