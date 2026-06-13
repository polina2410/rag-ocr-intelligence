# Current Feature: CSV Rows Parser (RaceResult + ObstacleSplit)

## Status
In Progress

## Goals

- New shared DTO file `packages/types/src/parsed-result.dto.ts` exporting `ParsedObstacleSplit` and `ParsedRaceResult` interfaces, re-exported from `index.ts` with a `.js` specifier
- New `apps/backend/src/ingestion/csv-rows-parser.service.ts` — `CsvRowsParserService.parseRows(csv: string, metadata: RaceMetadata): ParsedRaceResult[]`
- `CsvRowsParserService` added to `IngestionModule` providers and exports
- Parser skips `#` header block and column-header line; returns one `ParsedRaceResult` per data row in source order
- Time parsing handles both `HH:MM:SS` and `MM:SS` formats → integer seconds
- DNS/DNF/DSQ rows produce `splits: []`; FINISHED rows emit a split per obstacle (`splitTimeSeconds: null` if cell blank)
- Per-obstacle `penaltyCount` derived from `penalty_obstacles` semicolon-split name list (0 or 1)
- Obstacle/split alignment by ordinal position, not by parsing `split_` column suffix
- `genderPosition` always `null` (not in CSV)
- `pnpm --filter backend build` and `pnpm --filter backend lint` pass, zero `any`

## Notes

- Spec: `context/specs/step-15-csv-rows-parser.md`
- `csv-parse@^6.2.1` already installed — may be used for row tokenization
- Obstacle count for splits: `metadata.obstacles.length`, NOT `metadata.totalObstacles` (Super: 29 total vs 18 timed)
- Split columns assert count === `metadata.obstacles.length`; throw descriptive error on mismatch
- Malformed time string or non-integer place → throw descriptive error
- Caller passes `metadata: RaceMetadata` (service does NOT call `parseMetadata` internally)
- OUT OF SCOPE: unit tests (step 17), Multer (18), `POST /ingest/csv` (19), DB persistence, athlete dedup

## History

<!-- Completed features are tracked in context/features-history.md -->