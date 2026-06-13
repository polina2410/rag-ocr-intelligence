# Implementation Task: Unit Tests — CsvRowsParserService

## What to build
Jest unit tests for `CsvRowsParserService.parseRows()`, covering the row→result mapping, all status variants (FINISHED/DNS/DNF), both time formats (`MM:SS` and `HH:MM:SS`), penalty derivation, ordinal split alignment, and all error branches. Uses real fixture files; `metadata` is produced by calling `CsvMetadataParserService.parseMetadata()` on the same CSV (same approach the step-19 endpoint will use).

## Current state
- `apps/backend/src/ingestion/csv-rows-parser.service.ts` — `CsvRowsParserService.parseRows(csv, metadata): ParsedRaceResult[]`. Injectable, no constructor dependencies beyond the passed arguments.
- `apps/backend/src/ingestion/csv-metadata-parser.service.ts` — `CsvMetadataParserService.parseMetadata(csv): RaceMetadata`. Used in tests to produce the `metadata` argument.
- 5 fixture files in `apps/backend/test/fixtures/` (same as step 16):
  - `Spartan_Sprint_Novi_Sad_2024.csv` — 22 data rows: 20 FINISHED + 2 DNS; 17 split columns; includes multi-obstacle penalty rows
  - `Spartan_Sprint_Subotica_2024.csv` — 20 data rows: 17 FINISHED + 1 DNS + 2 DNF; 17 split columns; includes multi-obstacle penalty rows
  - `Spartan_Super_Belgrade_Open_2024.csv` — 19 data rows: all FINISHED; 18 split columns
  - `OCR_Winter_Challenge_Zlatibor_2024.csv` — 18 data rows: 16 FINISHED + 2 DNF; 15 split columns
  - `DEKA_FIT_Novi_Sad_2024.csv` — 19 data rows: all FINISHED; 10 split columns; all penalty_obstacles blank
- `packages/types/src/parsed-result.dto.ts` — `ParsedRaceResult`, `ParsedObstacleSplit`.
- Jest config: `rootDir: src`, `ts-jest`, no `moduleNameMapper` needed.

## Deliverables (definition of done)
1. New file `apps/backend/src/ingestion/csv-rows-parser.service.spec.ts`.
2. All tests pass with `pnpm --filter backend test`.
3. Coverage includes: correct row count per fixture, FINISHED row field mapping, DNS row (splits empty, positions null), DNF row (splits empty), penalty `penaltyCount: 1` on correct obstacles, zero penalties for DEKA, both time formats parsed to correct seconds, ordinal split alignment (obstacleName comes from metadata not CSV column name), `genderPosition` always null, trailing blank lines ignored.
4. Error-branch coverage: split-count mismatch, missing required column, invalid time string, non-integer position.
5. No shared mutable state; no `any`.

## Rules that must hold
- No `any`.
- Instantiate both services directly (`new CsvMetadataParserService()`, `new CsvRowsParserService()`) — no DI needed.
- Produce `metadata` by calling `metadataService.parseMetadata(csv)` on the same fixture string — do not hand-craft `RaceMetadata` objects (fragile and duplicates parsing logic).
- For error-branch tests: build minimal CSVs inline (string literals) — no fixture files needed.
- Each `it` tests one behaviour. Descriptive names.
- `genderPosition` tested explicitly as `null`, not merely falsy.

## Build steps
1. Create `apps/backend/src/ingestion/csv-rows-parser.service.spec.ts`.
2. Load all 5 fixtures at module scope with `fs.readFileSync` (same `fix()` helper pattern as step-16 spec). Parse each fixture's metadata once at module scope:
   ```typescript
   const metaSvc = new CsvMetadataParserService();
   const sprintMeta   = metaSvc.parseMetadata(sprintNoviSad);
   const suboticaMeta = metaSvc.parseMetadata(sprintSubotica);
   const superMeta    = metaSvc.parseMetadata(superBelgrade);
   const winterMeta   = metaSvc.parseMetadata(winterZlatibor);
   const dekaMeta     = metaSvc.parseMetadata(dekaNoviSad);
   ```
3. Top-level `describe('CsvRowsParserService', ...)` with `beforeEach` initialising `service = new CsvRowsParserService()`.
4. **Row count tests** (`describe('parseRows — row count', ...)`):
   - Sprint Novi Sad → 22 rows.
   - Sprint Subotica → 20 rows.
   - Super Belgrade → 19 rows (no trailing blank in fixture).
   - DEKA Novi Sad → 19 rows.
5. **FINISHED row mapping** (`describe('parseRows — FINISHED row', ...)`):
   Use DEKA fixture, first row (`bib=7505`): `Chloe Thomas, Elite Men, DEU, finish_time=30:28`.
   - `athlete.firstName === 'Chloe'`, `athlete.lastName === 'Thomas'`, `athlete.category === 'Elite Men'`, `athlete.nationality === 'DEU'`
   - `status === 'FINISHED'`
   - `finishTimeSeconds === 1828` (30×60 + 28)
   - `overallPosition === 1`, `categoryPosition === 1`
   - `genderPosition === null` (strict equality, not just falsy)
   - `splits.length === 10`
   - `splits[0].obstacleNumber === 1`
   - `splits[0].obstacleName === 'Sled Pull'` (from `dekaMeta.obstacles[0]`)
   - `splits[0].splitTimeSeconds === 189` (3×60 + 9)
   - `splits[0].penaltyCount === 0`
6. **HH:MM:SS time format** (`describe('parseRows — HH:MM:SS time', ...)`):
   Use Sprint Novi Sad, first row (`bib=1391`): `finish_time=01:08:36`.
   - `finishTimeSeconds === 4116` (1×3600 + 8×60 + 36)
   - Pick a split cell with `HH:MM:SS` (e.g. `splits[15].splitTimeSeconds === 3706` for `01:01:46`).
7. **DNS row** (`describe('parseRows — DNS row', ...)`):
   Sprint Novi Sad bib `8921` is at index 14 (0-based). Parse all rows and find by `athlete.lastName === 'Jones'` (or access by index if row order is asserted).
   - `status === 'DNS'`
   - `finishTimeSeconds === null`
   - `overallPosition === null`
   - `categoryPosition === null`
   - `genderPosition === null`
   - `splits` is `[]` (length 0)
8. **DNF row** (`describe('parseRows — DNF row', ...)`):
   Subotica fixture: `bib=1430` (`Matt Roberts`).
   - `status === 'DNF'`, `finishTimeSeconds === null`, `splits.length === 0`.
9. **Penalty derivation** (`describe('parseRows — penalty count', ...)`):
   Subotica fixture `bib=7491` (`Ruby Anderson`): `penalty_obstacles = Rope Climb; Multi Rig`. Obstacles list: `['Rolling Mud', 'Z Wall', 'Barbed Wire Crawl', 'Sandbag Carry', 'Spear Throw', 'Rope Climb', 'Hercules Hoist', 'Dunk Wall', 'Tyrolean Traverse', 'Monkey Bars', 'Bucket Carry', 'Atlas Carry', 'Wall Climb', 'Inverted Wall', 'Jump and Carry', 'Multi Rig', 'Box Jump']`. Rope Climb = index 5, Multi Rig = index 15.
   - Parse all rows; find by `athlete.lastName === 'Anderson' && athlete.firstName === 'Ruby'`.
   - `splits[5].obstacleName === 'Rope Climb'`, `splits[5].penaltyCount === 1`.
   - `splits[15].obstacleName === 'Multi Rig'`, `splits[15].penaltyCount === 1`.
   - `splits[0].penaltyCount === 0` (Rolling Mud, not penalised).
10. **Zero penalties (DEKA)** (`'all splits have penaltyCount 0 for DEKA fixture'`):
    Parse DEKA; assert every split in every row has `penaltyCount === 0`.
11. **Ordinal split alignment** (`'obstacleName comes from metadata not CSV column suffix'`):
    Super Belgrade fixture, first row. `superMeta.obstacles[0] === 'Tire Drag'`. Assert `splits[0].obstacleName === 'Tire Drag'` (not `'tire_drag'` or any other form).
12. **Super race split count** (`'FINISHED rows in Super fixture have 18 splits'`):
    Parse Super Belgrade; assert every row with `status === 'FINISHED'` has `splits.length === 18`.
13. **Error — split count mismatch** (`describe('parseRows — errors', ...)`):
    Build a CSV with the Super header block but only 2 obstacles in `# Obstacles:` (so `metadata.obstacles.length === 2`) yet the column-header row has 18 `split_*` columns. Pass mismatched `metadata` and assert `expect(() => service.parseRows(csv, fakeMeta)).toThrow()`.
    Alternatively: produce a real `superMeta`, then call `parseRows` with `sprintSubotica` (17 split columns) → throws because 17 ≠ 18.
14. **Error — missing required column** (`'throws when overall_place column is missing'`):
    Build a minimal CSV whose column-header row omits `overall_place`; assert throws with message containing `'overall_place'`.
15. **Error — invalid time string** (`'throws on invalid split time value'`):
    Build a minimal FINISHED row whose first split cell is `'abc'`; assert throws.
16. Run `pnpm --filter backend test` — all tests green.

## Notes for the implementer
**Finding rows by bib/name:** `parseRows` returns rows in source order with no bib field. Two options:
- Use `results[index]` (assert row count first, then index into the array). More brittle to fixture reordering.
- Use `results.find(r => r.athlete.firstName === 'X' && r.athlete.lastName === 'Y')` then assert it's defined. Preferred for named-athlete assertions.

**DEKA first-row assertions (Build step 5):** `7505,Chloe,Thomas,Elite Men,DEU,30:28,...,03:09,...` → first split `03:09` → `3*60+9 = 189`.

**Sprint Novi Sad first-row (Build step 6):** `1391,Adam,Jovanovic,...,01:08:36,...,01:01:46,...` → `finishTimeSeconds = 3600+8*60+36 = 4116`; split index 15 (Monkey Bars) = `01:01:46` → `3600+1*60+46 = 3706`.

**DNS row index (Build step 7):** `bib=8921, Ben Jones` is the 15th data row (0-based index 14) in the Sprint Novi Sad fixture. Prefer `.find()` over hardcoded index.

**Error CSV for Build step 13 (cross-fixture mismatch):** Call `service.parseRows(sprintSuboticaCsv, superMeta)` — `sprintSuboticaCsv` has 17 split columns, `superMeta.obstacles.length === 18`. The column-count assertion fires immediately.

**Error CSV for Build step 14 (missing column):**
```
# Race: Test\n# Date: 2024-01-01\n# Location: Test\n# Distance (km): 5.0\n# Total obstacles: 2\n# Race type: Sprint\n# Obstacles: A, B\n#\nbib,first_name,last_name,category,nationality,finish_time,chip_time,total_penalties_sec,penalty_obstacles,obstacles_completed,category_place,split_a,split_b\n1,A,B,Cat,SRB,01:00,01:00,0,,2,1,00:30,01:00\n
```
(Note `overall_place` is omitted.)

**Trailing blank lines:** all 5 fixtures end with a trailing newline → the parser's `if (!line) continue` skips it. Assert row counts match exactly (no off-by-one from the empty last line).