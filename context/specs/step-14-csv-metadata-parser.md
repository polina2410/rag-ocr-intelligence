# Implementation Task: CSV Metadata Parser (RaceMetadata)

## What to build
A pure, testable parser that reads the leading `#` comment-header lines of an OCR results CSV and returns a typed `RaceMetadata` object describing the race (name, date, location, distance, obstacle count, race type, and the ordered list of timed obstacle names). This is the parser only — no upload, no endpoint, no DB persistence.

## Actual CSV header format (confirmed from `fixtures/` samples, 2026-06-13)
```
# Race: DEKA FIT Novi Sad 2024
# Date: 2024-08-10
# Location: Novi Sad Sports Center, Serbia
# Distance (km): 5.0
# Total obstacles: 10
# Race type: DEKA
# Obstacles: Sled Pull, Assault Bike, Rowing, Sandbag Lunges, Sled Push, SkiErg, ...
#
bib,first_name,last_name,category,nationality,finish_time,...   <- first non-# line (column headers)
```
Verified across all 5 sample files. Notes:
- Delimiter is `: ` (colon-space). Keys are human-readable **labels**, NOT camelCase — a label→field map is required.
- `Date` is ISO `YYYY-MM-DD` (matches Postgres `date`). `Distance (km)` value is a decimal. `Race type` values seen: `Sprint`, `Super`, `DEKA` (Title-case).
- `Obstacles` is a comma-separated **ordered** list of the timed obstacle names; the `split_<obstacle>` data columns (step 15) correspond to this list.
- A lone `#` line terminates the header block before the column-header row; treat empty-content `#` lines as skippable comments.
- **Discrepancy to preserve:** `Total obstacles` is a course-level count (e.g. Super = 29) and does NOT equal the number of named/timed obstacles (Super lists 18). Keep both as distinct fields — do not derive one from the other.

### Label → field mapping (case-insensitive on the label)
| `#` label | `RaceMetadata` field | type |
|---|---|---|
| `Race` | `name` | string |
| `Date` | `date` | string (ISO) |
| `Location` | `location` | string |
| `Distance (km)` | `distanceKm` | number |
| `Total obstacles` | `totalObstacles` | number |
| `Race type` | `raceType` | `'Sprint' \| 'Super' \| 'DEKA' \| 'Open'` |
| `Obstacles` | `obstacles` | string[] (split on `,`, trimmed) |

## Current state
- `packages/types/src/race.dto.ts` — defines `RaceDto`: `id`, `name`, `date` (string), `location`, `distanceKm` (number), `totalObstacles` (number), `raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open'`.
- `packages/types/src/index.ts` — barrel re-exports using **`.js` extension specifiers** (`export * from './race.dto.js'`); package is ESM (`packages/types/package.json` → `"type": "module"`, exports `./src/index.ts`).
- `apps/backend/src/entities/race.entity.ts` — `Race` entity mapped to `races` table; columns: `name` (varchar 255), `date` (date), `location` (varchar 255), `distance_km` (numeric 6,2), `total_obstacles` (int), `race_type` (varchar 20). `id` is DB-generated (uuid) — NOT part of metadata.
- `apps/backend/package.json` — `csv-parse@^6.2.1` ✅ already a dependency; `@types/csv-parse@^1.2.5` present. Jest configured (`*.spec.ts`, `rootDir: src`, `ts-jest`).
- `apps/backend/tsconfig.json` — `module/moduleResolution: nodenext`, extends root `tsconfig.json` with `strict: true`. No `any` allowed (strict + noImplicitAny via strict).
- `apps/backend/src/app.module.ts` — registers entities; **no `ingestion`/`ingest` module exists yet**.
- ❌ No existing `RaceMetadata` type. ❌ No existing parser code. The `#` header format is currently UNDEFINED (see open questions).

## Deliverables (definition of done)
1. A `RaceMetadata` type exists in `packages/types/` as a shared DTO (`race-metadata.dto.ts`, re-exported from `index.ts` with a `.js` specifier). Fields: `name: string`, `date: string`, `location: string`, `distanceKm: number`, `totalObstacles: number`, `raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open'`, `obstacles: string[]`. No `id` (DB-generated). Reuse the `raceType` union from `RaceDto`.
2. A parser function/service that accepts raw CSV text (`string`) and returns a `RaceMetadata`. **Recommendation: a NestJS `ingestion` feature module with an injectable `CsvMetadataParserService`** exposing `parseMetadata(csv: string): RaceMetadata` (see Notes for reasoning vs. standalone util).
3. The parser reads ONLY the leading lines beginning with `#`, stops at the first non-comment line, and ignores the data rows entirely.
4. The parser parses each recognized header key into the correctly typed field: `distanceKm` and `totalObstacles` are `number`s (not strings); `date` is a validated string; `raceType` is constrained to the four allowed literals.
5. Defined, documented error behavior for malformed/missing input (see Rules): a single dedicated error type/exception is thrown with a message naming the missing/invalid field.
6. `pnpm --filter backend build` and `pnpm --filter backend lint` pass with zero `any` and zero new errors.
7. The chosen `RaceMetadata` location compiles under both `@ocr/types` (ESM) and backend (`nodenext`) — if added to `packages/types`, the barrel export in `index.ts` uses a `.js` specifier.

## Rules that must hold
- No `any` — use `unknown`/proper types/generics (CLAUDE.md + strict).
- Named exports for backend code; DTOs/types use named exports.
- If parser is a service, it follows NestJS feature-module layout (`ingestion/ingestion.module.ts`, `ingestion/<name>.service.ts`); no OpenAI/HTTP/DB logic inside it (pure transformation).
- The parser is **pure**: no file-system reads, no Multer, no repository/DB calls, no network. Input is text, output is an object (or a thrown error).
- Malformed/missing required header → **throw** a descriptive error (do NOT return a partial object and do NOT silently default). Numeric fields that fail to parse to a finite number → throw. `raceType` outside the allowed set → throw.
- Preserve column-name mapping consistency with `RaceDto`/`Race` (e.g. metadata `distanceKm` ↔ entity `distance_km`). Do not invent fields absent from `RaceDto`.
- New shared DTO must keep `packages/types` ESM-clean: `.js` import specifier in `index.ts`.

## Build steps
1. Decide and create the `RaceMetadata` type per Deliverable 1 (recommended: `packages/types/src/race-metadata.dto.ts`, re-exported from `index.ts` with `.js` specifier). Reuse the `raceType` union from `RaceDto` to avoid duplication.
2. Scaffold the `ingestion` feature module under `apps/backend/src/ingestion/` (module + service). Do NOT add a controller yet (endpoint is step 19).
3. Implement `CsvMetadataParserService.parseMetadata(csv: string): RaceMetadata`: split into lines, collect leading `#` lines, stop at first non-`#`/non-blank line.
4. For each comment line, strip the leading `#`, split on the agreed key/value delimiter, normalize the key, and map to the corresponding `RaceMetadata` field.
5. Coerce and validate: `distanceKm` → finite number; `totalObstacles` → non-negative integer; `date` → validated string format; `raceType` → one of the four literals. Throw the dedicated error on any failure or missing required key.
6. Register the module/service in `app.module.ts` (or leave wiring to step 19 — note this choice in code comments; do not enable any route).
7. Run `pnpm --filter backend lint` and `pnpm --filter backend build`; fix issues.

## Notes for the implementer

**Recommendation — where `RaceMetadata` lives:** Put it in `packages/types/` as a shared DTO. Reasoning: the ingestion endpoint (step 19) and likely the frontend (ingest preview/confirmation UI) will both reference the parsed race shape, mirroring how `RaceDto` is already shared. A backend-internal interface would force later duplication. (If the user is certain the frontend will never see metadata, a backend-internal interface in `ingestion/` is acceptable — flag for confirmation.)

**Recommendation — where the parser lives:** A NestJS `ingestion` module with an injectable `CsvMetadataParserService`. Reasoning: steps 18–19 build a Multer upload and `POST /ingest/csv` in the same domain; an injectable service is testable (step 16) and ready for DI into the future controller. A standalone util breaks the CLAUDE.md feature-module convention and complicates later wiring — not recommended.

**Resolved decisions (2026-06-13):**
- Header format → **confirmed from the 5 `fixtures/` samples** (see "Actual CSV header format" section + label→field map above). No longer provisional.
- `RaceMetadata` placement → **shared DTO in `packages/types/`** (`race-metadata.dto.ts`, re-exported from `index.ts` with `.js` specifier).
- All seven fields (incl. `obstacles`) are **REQUIRED** → throw a descriptive error naming any missing/blank field. `obstacles` must be a non-empty array.
- Unknown `#` labels → **ignored** (skip any `#` line whose label isn't in the mapping table); a lone `#` / empty-content comment line is skipped.
- Label matching → **case-insensitive** on the label text. `raceType` value matched case-insensitively, then normalized to the canonical literal (`Sprint`/`Super`/`DEKA`/`Open`); a value outside the set throws.

**No remaining blockers.** Implement against the confirmed format. Use `fixtures/*.csv` as fixtures for the step-16 tests.

**Out of scope (explicitly deferred):**
- Unit tests → **step 16**.
- Multer upload middleware → **step 18**.
- `POST /ingest/csv` endpoint / controller → **step 19**.
- DB persistence / saving the `Race` row → out of scope (step 19+).
- Parsing data rows into `RaceResult` / `ObstacleSplit` → **step 15** (this step is metadata headers only).

**Gotchas:**
- `@ocr/types` is ESM with `.js` import specifiers — a new DTO file must be re-exported in `index.ts` as `'./race-metadata.dto.js'`.
- Backend is `nodenext` + `strict`; ensure number coercion never yields `NaN` silently and no implicit `any` on parsed values.
- Keep field/column mapping aligned: metadata `distanceKm`/`totalObstacles`/`raceType` ↔ entity `distance_km`/`total_obstacles`/`race_type`.