# Implementation Task: CSV Rows Parser (RaceResult + ObstacleSplit)

## What to build
A pure, testable NestJS service that parses the data rows of an OCR results CSV (the lines after the `#` header block) and maps each row to a typed result object containing athlete identity, race-result fields, and an ordered array of obstacle splits. Parser only — no upload, no endpoint, no DB persistence, no entity instantiation.

## Current state
- `apps/backend/src/ingestion/csv-metadata-parser.service.ts` — `CsvMetadataParserService.parseMetadata(csv): RaceMetadata`. Reads only `#` lines, stops at first non-`#` line. Returns `obstacles: string[]` (ordered canonical obstacle names). This is the sibling parser; the rows parser is a NEW file in the same module.
- `apps/backend/src/ingestion/ingestion.module.ts` — `IngestionModule` already registered in `app.module.ts`, exports `CsvMetadataParserService`.
- `packages/types/src/race-metadata.dto.ts` — `RaceMetadata` (has `obstacles: string[]`).
- `packages/types/src/athlete.dto.ts` — `AthleteDto { id; firstName; lastName; nationality; category: string }`.
- `packages/types/src/index.ts` — barrel re-exports using `.js` specifiers.
- `apps/backend/src/entities/race-result.entity.ts` — fields: `overallPosition: number|null`, `finishTimeSeconds: number|null`, `status: 'FINISHED'|'DNF'|'DNS'|'DSQ'` (default `'FINISHED'`), `categoryPosition: number|null`, `genderPosition: number|null`.
- `apps/backend/src/entities/obstacle-split.entity.ts` — fields: `obstacleNumber: number` (1-based), `obstacleName: string`, `splitTimeSeconds: number|null`, `penaltyCount: number` (default 0).
- `csv-parse@^6.2.1` + `@types/csv-parse` already installed in `apps/backend/package.json`.
- 5 fixtures in `apps/backend/test/fixtures/`: Sprint (17 obstacles), Super (18 obstacles), DEKA (10 obstacles, 0 penalties).

## Deliverables (definition of done)
1. New shared DTO file `packages/types/src/parsed-result.dto.ts` exporting:
   ```typescript
   export interface ParsedObstacleSplit {
     obstacleNumber: number          // 1-based ordinal; matches metadata.obstacles index + 1
     obstacleName: string            // canonical name from metadata.obstacles[i]
     splitTimeSeconds: number | null // cumulative elapsed seconds; null when source cell blank
     penaltyCount: number            // 0 or 1
   }

   export interface ParsedRaceResult {
     athlete: {
       firstName: string
       lastName: string
       nationality: string
       category: string
     }
     overallPosition: number | null
     finishTimeSeconds: number | null
     status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'
     categoryPosition: number | null
     genderPosition: null            // always null — not present in CSV
     splits: ParsedObstacleSplit[]
   }
   ```
2. `packages/types/src/index.ts` updated to include `export * from './parsed-result.dto.js'`.
3. New file `apps/backend/src/ingestion/csv-rows-parser.service.ts` — `@Injectable()` class `CsvRowsParserService` with the public method:
   ```typescript
   parseRows(csv: string, metadata: RaceMetadata): ParsedRaceResult[]
   ```
4. `CsvRowsParserService` added to `IngestionModule` `providers` and `exports` (matching existing pattern).
5. Returns one `ParsedRaceResult` per data row, in source order. The `#` header block and the column-header line are skipped. Trailing blank lines produce no output.
6. Time-parsing helper handles both `HH:MM:SS` and `MM:SS` formats and returns integer seconds; blank/`DNS`/`DNF`/`DSQ` cells yield `null` where the field is nullable.
7. Penalty derivation: `penaltyCount = 1` if the canonical obstacle name (`metadata.obstacles[i]`) appears in the semicolon-split `penalty_obstacles` cell after trimming, else `0`.
8. DNS/DNF/DSQ rows produce `splits: []` (do not emit splits for non-finishing athletes). For `FINISHED` rows, emit a split for every position in `metadata.obstacles`; `splitTimeSeconds` is `null` if the cell is blank.
9. `pnpm --filter backend build` and `pnpm --filter backend lint` pass with zero `any` and zero new errors.

## Rules that must hold
- No `any` — use `unknown`/proper types (backend is `strict` + `noImplicitAny`).
- Named exports only.
- Parser is pure: no `Repository`, no TypeORM entity classes, no DB access, no network.
- Field names must match entity field names exactly (camelCase) so the step-19 persistence layer maps 1:1: `overallPosition`, `finishTimeSeconds`, `status`, `categoryPosition`, `genderPosition`, `obstacleNumber`, `obstacleName`, `splitTimeSeconds`, `penaltyCount`.
- No magic numbers — extract `SECONDS_PER_HOUR = 3600`, `SECONDS_PER_MINUTE = 60`.
- `genderPosition` is ALWAYS `null` — do not attempt to derive it.
- Obstacle count for splits comes from `metadata.obstacles.length`, NOT from `metadata.totalObstacles` (Super: 29 total obstacles but 18 split columns).
- Split times are stored as cumulative elapsed seconds — do NOT subtract previous split to get duration.
- `@ocr/types` is ESM (`"type": "module"`); new DTO must be re-exported in `index.ts` with a `.js` specifier.

## Build steps
1. Create `packages/types/src/parsed-result.dto.ts` with the two interfaces from Deliverable 1. Add `export * from './parsed-result.dto.js'` to `packages/types/src/index.ts`.
2. Create `apps/backend/src/ingestion/csv-rows-parser.service.ts`. Split `csv` on `\n`; skip leading lines where `line.trimEnd().startsWith('#')`; the first non-`#` non-blank line is the column-header row.
3. Tokenize the column-header row with `csv-parse/sync` or `.split(',').map(s => s.trim())`. Collect the indices of all `split_*` columns in order; assert `splitCols.length === metadata.obstacles.length` (throw descriptive `Error` on mismatch).
4. Locate fixed column indices by name: `first_name`, `last_name`, `category`, `nationality`, `finish_time`, `penalty_obstacles`, `overall_place`, `category_place`. (Consume but discard: `bib`, `chip_time`, `total_penalties_sec`, `obstacles_completed`.)
5. Implement `parseTime(value: string): number`: trim, split on `:`. If 3 parts → `h*3600 + m*60 + s`. If 2 parts → `m*60 + s`. Validate each part is a non-negative integer; throw descriptive `Error` if not.
6. Implement `parseStatus(cell: string): 'FINISHED'|'DNF'|'DNS'|'DSQ'`: compare trimmed, case-insensitively. `'dns'` → `'DNS'`, `'dnf'` → `'DNF'`, `'dsq'` → `'DSQ'`, any other non-blank → `'FINISHED'`.
7. For each remaining non-empty data row, tokenize and build a `ParsedRaceResult`:
   - `athlete`: `firstName`, `lastName`, `nationality`, `category` ← trimmed cells at their indices.
   - `status` ← `parseStatus(finish_time cell)`.
   - `finishTimeSeconds`: `null` if status is not `'FINISHED'` or if cell is blank; else `parseTime(cell)`.
   - `overallPosition` / `categoryPosition`: parse cell as integer; `null` if blank.
   - `genderPosition`: `null`.
8. Build `splits`: if `status !== 'FINISHED'` → `splits: []`. Otherwise, for each `i` in `0..metadata.obstacles.length-1`:
   - `obstacleNumber = i + 1`, `obstacleName = metadata.obstacles[i]`.
   - Parse `penalty_obstacles` cell once per row (semicolon-split, trim each part) into a `Set<string>`.
   - `penaltyCount`: `1` if `metadata.obstacles[i]` is in the set, else `0`.
   - `splitTimeSeconds`: `null` if cell blank, else `parseTime(cell)`.
9. Register `CsvRowsParserService` in `IngestionModule` `providers` and `exports`.
10. Run `pnpm --filter backend lint` and `pnpm --filter backend build`; fix any errors.

## Notes for the implementer

**Out of scope:** unit tests (step 17), Multer upload (step 18), `POST /ingest/csv` endpoint (step 19), DB persistence, athlete dedup/upsert.

**Files to create/edit:**
- `packages/types/src/parsed-result.dto.ts` (new)
- `packages/types/src/index.ts` (add re-export)
- `apps/backend/src/ingestion/csv-rows-parser.service.ts` (new)
- `apps/backend/src/ingestion/ingestion.module.ts` (add provider + export)

**Obstacle matching by ordinal, not by name:** The `split_*` suffix does NOT reliably round-trip to the canonical obstacle name (e.g. `Box Step-Ups` → `split_box_step-ups` via hyphen, not underscore). Match split columns to obstacles strictly by left-to-right ordinal position.

**Time format is per-cell, not per-column:** Both `MM:SS` (e.g. `49:22`, `03:53`) and `HH:MM:SS` (e.g. `01:08:36`) appear in the same split column across different rows. `parseTime` must branch on part count every call.

**`total_penalties_sec` is NOT stored.** Per-obstacle `penaltyCount` is derived from the `penalty_obstacles` obstacle-name list only. The penalty seconds value is consistent (30×count for Spartan) but is not persisted.

**DEKA peculiarity:** DEKA has `Total obstacles: 10` in the header AND 10 split columns AND 10 obstacles in `metadata.obstacles` — so `metadata.obstacles.length === split columns count` holds for DEKA too, confirming the assertion in Build step 3.

**DNS row anatomy (from fixture):**
```
8921,Ben,Jones,Age Group 30-39 M,HUN,DNS,DNS,,,8,,,,,,,,,,,,,,,,,,
```
`finish_time=DNS`, `overall_place=<blank>`, `category_place=<blank>`, all split cells blank → `status:'DNS'`, `finishTimeSeconds:null`, `overallPosition:null`, `categoryPosition:null`, `splits:[]`.

**Resolved decisions:**
1. FINISHED rows with blank individual split cells → emit the split with `splitTimeSeconds: null` (not seen in fixtures but keeps ordinal alignment intact).
2. Malformed time string or non-integer place → throw a descriptive `Error` naming the column and row value (consistent with metadata parser behaviour; caller decides whether to skip or abort).
3. `parseRows` requires the caller to supply `metadata: RaceMetadata` — the service does NOT call `parseMetadata` internally (single responsibility; avoids parsing the header block twice in the step-19 flow).