# Current Feature: CSV Metadata Parser (RaceMetadata)

## Status
In Progress

## Goals

- New shared DTO `RaceMetadata` in `packages/types/src/race-metadata.dto.ts`, re-exported from `index.ts` with a `.js` specifier
  - Fields: `name`, `date`, `location` (string); `distanceKm`, `totalObstacles` (number); `raceType` (reuse `RaceDto['raceType']` union); `obstacles` (string[])
- New NestJS `ingestion` module under `apps/backend/src/ingestion/` (module + `CsvMetadataParserService`, no controller yet)
- `CsvMetadataParserService.parseMetadata(csv: string): RaceMetadata` — pure function, no FS/DB/network
  - Reads only leading `#` lines, stops at first non-`#` line
  - Maps human-readable labels → fields (case-insensitive): `Race`→name, `Date`→date, `Location`→location, `Distance (km)`→distanceKm, `Total obstacles`→totalObstacles, `Race type`→raceType, `Obstacles`→obstacles[]
  - Coerces numbers (no silent NaN); normalizes `raceType` to canonical literal
  - All 7 fields required → throw descriptive error on missing/blank/invalid; unknown labels ignored
- `pnpm --filter backend build` and `pnpm --filter backend lint` pass, zero `any`

## Notes

- Header format confirmed from `ocr-files/*.csv` (5 samples) — see spec for exact format + label→field table
- `totalObstacles` (course count, e.g. Super=29) ≠ length of `obstacles` list (e.g. 18) — keep both, do not derive
- `@ocr/types` is ESM (`type: module`); new DTO must be re-exported as `'./race-metadata.dto.js'`
- Backend is `nodenext` + `strict` + `noImplicitAny` — no `any`, no silent NaN
- OUT OF SCOPE: unit tests (step 16), Multer (18), `POST /ingest/csv` endpoint (19), DB persistence, data-row parsing (15)

## History

<!-- Completed features are tracked in context/features-history.md -->