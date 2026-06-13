# Implementation Task: Unit Tests — CsvMetadataParserService

## What to build
Jest unit tests for `CsvMetadataParserService.parseMetadata()`, covering the full label→field mapping, all error branches, and edge cases (unknown labels, case-insensitive matching, decimal distance, `totalObstacles` vs `obstacles.length` discrepancy). Uses real fixture files from `apps/backend/test/fixtures/`.

## Current state
- `apps/backend/src/ingestion/csv-metadata-parser.service.ts` — `CsvMetadataParserService.parseMetadata(csv: string): RaceMetadata`. Injectable, no constructor dependencies.
- 5 fixture files in `apps/backend/test/fixtures/`:
  - `Spartan_Sprint_Novi_Sad_2024.csv` — Sprint, 8.0 km, 23 total, 17 timed obstacles
  - `Spartan_Sprint_Subotica_2024.csv` — Sprint, 8.5 km, 23 total, 17 timed obstacles
  - `Spartan_Super_Belgrade_Open_2024.csv` — Super, 13.0 km, **29 total**, 18 timed obstacles
  - `OCR_Winter_Challenge_Zlatibor_2024.csv` — **Open**, 10.0 km, 20 total, 15 timed obstacles
  - `DEKA_FIT_Novi_Sad_2024.csv` — **DEKA**, 5.0 km, 10 total, 10 timed obstacles
- Jest `rootDir: src`, `testRegex: .*\.spec\.ts$`, `transform: ts-jest`. No `moduleNameMapper` needed — `@ocr/types` resolves through pnpm workspace symlink.
- `packages/types/src/race-metadata.dto.ts` — `RaceMetadata` interface (`name`, `date`, `location`, `distanceKm`, `totalObstacles`, `raceType`, `obstacles`).

## Deliverables (definition of done)
1. New file `apps/backend/src/ingestion/csv-metadata-parser.service.spec.ts`.
2. All tests pass with `pnpm --filter backend test`.
3. The test suite covers: 4 happy-path fixture parses, all 7 missing-field errors, 4 invalid-value errors (date format, NaN distance, non-integer obstacles, unknown raceType), 3 edge-case behaviours (unknown label ignored, blank `#` line skipped, case-insensitive label and raceType).
4. No shared mutable state between tests (no `let` assignments inside `describe` without `beforeEach`).
5. Zero `any`.

## Rules that must hold
- No `any`.
- Fixtures loaded with `fs.readFileSync` + `path.join(__dirname, ...)` — no hardcoded absolute paths.
- Instantiate service directly (`new CsvMetadataParserService()`) — no `@nestjs/testing` needed (service has no DI deps).
- Each `it` block tests exactly one behaviour — do not bundle multiple unrelated assertions in one test.
- Descriptive test names: `'parses name from Sprint fixture'`, `'throws when Date field is missing'`, etc.
- Do not import `RaceMetadata` type to compare shapes — just access fields directly; TypeScript inference is sufficient.

## Build steps
1. Create `apps/backend/src/ingestion/csv-metadata-parser.service.spec.ts`.
2. At the top of the file, load all 5 fixtures once using `fs.readFileSync`:
   ```typescript
   import * as fs from 'fs';
   import * as path from 'path';
   const fix = (name: string) =>
     fs.readFileSync(path.join(__dirname, '../../test/fixtures', name), 'utf-8');
   const sprintNoviSad  = fix('Spartan_Sprint_Novi_Sad_2024.csv');
   const sprintSubotica = fix('Spartan_Sprint_Subotica_2024.csv');
   const superBelgrade  = fix('Spartan_Super_Belgrade_Open_2024.csv');
   const winterZlatibor = fix('OCR_Winter_Challenge_Zlatibor_2024.csv');
   const dekaNoviSad    = fix('DEKA_FIT_Novi_Sad_2024.csv');
   ```
3. Write a top-level `describe('CsvMetadataParserService', () => { ... })`.
4. Inside it, create a `let service: CsvMetadataParserService` initialised in `beforeEach(() => { service = new CsvMetadataParserService(); })`.
5. **Happy-path tests** (`describe('parseMetadata — happy path', ...)`):
   - `'parses all fields from Sprint fixture'` — parse `sprintNoviSad`; assert `name === 'Spartan Sprint Novi Sad 2024'`, `date === '2024-04-13'`, `location === 'Fruska Gora, Serbia'`, `distanceKm === 8`, `totalObstacles === 23`, `raceType === 'Sprint'`, `obstacles` is an array of length 17 starting with `'Hercules Hoist'`.
   - `'parses raceType DEKA correctly'` — parse `dekaNoviSad`; assert `raceType === 'DEKA'` and `obstacles.length === 10`.
   - `'parses raceType Open correctly'` — parse `winterZlatibor`; assert `raceType === 'Open'`.
   - `'totalObstacles differs from obstacles.length for Super race'` — parse `superBelgrade`; assert `totalObstacles === 29` and `obstacles.length === 18`.
   - `'parses decimal distanceKm'` — parse `sprintSubotica`; assert `distanceKm === 8.5`.
6. **Missing-field error tests** (`describe('parseMetadata — missing required fields', ...)`):
   For each of the 7 fields, build a minimal CSV missing that field and assert `expect(() => service.parseMetadata(csv)).toThrow()`. Also assert the error message contains the field label name (e.g. `.toThrow('Race')`). Missing-field CSVs:
   - No `# Race:` line → `.toThrow('Race')`
   - No `# Date:` line → `.toThrow('Date')`
   - No `# Location:` line → `.toThrow('Location')`
   - No `# Distance (km):` line → `.toThrow('Distance')`
   - No `# Total obstacles:` line → `.toThrow('Total obstacles')`
   - No `# Race type:` line → `.toThrow('Race type')`
   - No `# Obstacles:` line → `.toThrow('Obstacles')`
7. **Invalid-value error tests** (`describe('parseMetadata — invalid values', ...)`):
   - Invalid date `# Date: 2024-13` → `.toThrow('Date')`
   - Non-numeric distance `# Distance (km): abc` → `.toThrow('Distance')`
   - Non-integer obstacles `# Total obstacles: 29.5` → `.toThrow('Total obstacles')`
   - Unknown raceType `# Race type: Marathon` → `.toThrow('Race type')`
   - Empty obstacles value `# Obstacles: ` (blank after colon) → `.toThrow('Obstacles')`
8. **Edge-case tests** (`describe('parseMetadata — edge cases', ...)`):
   - `'ignores unknown # labels'` — build CSV with an extra `# Foo: bar` line; parse succeeds, returned object has no extra keys beyond the 7 known fields.
   - `'ignores blank # lines'` — build CSV with a lone `#` line between metadata lines; parse succeeds.
   - `'matches labels case-insensitively'` — build CSV using `# race: ...` / `# DATE: ...`; parse succeeds and fields are correct.
   - `'normalises raceType case-insensitively'` — build CSV with `# Race type: sprint` (lowercase); `raceType === 'Sprint'`.
9. Run `pnpm --filter backend test` — fix any failures.

## Notes for the implementer
**Fixture path from spec file:** `__dirname` in ts-jest points to the source file's directory (`src/ingestion/`). Fixtures are at `../../test/fixtures/` relative to that.

**Minimal CSV for error tests** — a valid header block missing one field, followed by an empty data section:
```
# Race: Test Race
# Date: 2024-01-01
# Location: Test Location
# Distance (km): 5.0
# Total obstacles: 10
# Race type: Sprint
# Obstacles: Obstacle One, Obstacle Two
#
```
Remove one `#` line per test to trigger that field's error.

**`totalObstacles` type:** `requireNonNegativeInt` rejects `29.5` because `Number.isInteger(29.5)` is false. Test this directly with a hand-crafted CSV.

**`obstacles` array ordering:** assert `obstacles[0]` and `obstacles[obstacles.length - 1]` from the Sprint fixture to verify split-and-trim behaviour without enumerating all 17.