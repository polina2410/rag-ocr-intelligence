# Current Feature: Unit Tests for CSV Parsers (Steps 16 + 17)

## Status
In Progress

## Goals

- `apps/backend/src/ingestion/csv-metadata-parser.service.spec.ts` with happy-path, missing-field, invalid-value, and edge-case tests for `CsvMetadataParserService`
- `apps/backend/src/ingestion/csv-rows-parser.service.spec.ts` with row-count, FINISHED mapping, DNS/DNF, penalty derivation, time format, ordinal alignment, and error-branch tests for `CsvRowsParserService`
- `pnpm --filter backend test` passes with all new tests green

## Notes

- Specs: `context/specs/step-16-unit-tests-csv-metadata-parser.md` and `context/specs/step-17-unit-tests-csv-rows-parser.md`
- Instantiate services directly (`new CsvMetadataParserService()`, `new CsvRowsParserService()`) — no DI needed
- Fixture path from spec file: `path.join(__dirname, '../../test/fixtures', name)` (rootDir is `src`)
- `metadata` for rows-parser tests produced by calling `metadataService.parseMetadata(csv)` — never hand-crafted
- OUT OF SCOPE: changes to service implementation, new fixtures, e2e tests

## History

<!-- Completed features are tracked in context/features-history.md -->