# Features History

<!-- Completed features are appended here by /feature complete -->

## Turborepo Monorepo Scaffold

**Branch:** turborepo-monorepo-scaffold
**Completed:** 2026-06-12

### Goals

- Move `frontend/` → `apps/frontend/`, `backend/` → `apps/backend/`
- Add `packages/types/` with `@ocr/types` (RaceDto, AthleteDto)
- Configure Turbo pipeline, root tsconfig base, updated pnpm-workspace.yaml
- Backend resolves `@ocr/types` via `paths` alias in tsconfig
- Both apps import from `@ocr/types` without TypeScript errors

### Summary

Wired existing Vite/React and NestJS apps into a Turborepo monorepo under `apps/`. Created shared `@ocr/types` package with initial DTOs. Root `tsconfig.json` acts as a minimal base; each app extends it with its own resolution strategy. `pnpm install` resolves all 4 workspace packages cleanly. Lint and build pass.

---

## Shared ESLint Config

**Branch:** shared-eslint-config
**Completed:** 2026-06-12

### Goals

- Create `packages/eslint-config/` (`@ocr/eslint-config`) exporting `base`, `react`, and `nestjs` flat configs
- Replace `apps/frontend/eslint.config.js` with a thin wrapper importing `@ocr/eslint-config/react`
- Replace `apps/backend/eslint.config.mjs` with a thin wrapper importing `@ocr/eslint-config/nestjs`
- Add `packages/types/eslint.config.js` using `@ocr/eslint-config/base` + `lint` script
- Align ESLint to `^10` in both apps (backend was on `^9`)
- All three `lint` commands pass with 0 errors

### Summary

Created `@ocr/eslint-config` as a peer-dep-only package exporting three flat configs. Frontend and backend configs replaced with thin wrappers. ESLint aligned to v10 across the monorepo. `no-explicit-any: error` now enforced everywhere (was `off` in backend). Added `"types": ["jest", "node"]` to backend tsconfig to fix `projectService` not discovering jest globals as ambient types. All three lint commands pass: frontend (0 errors), backend (0 errors, 1 expected `no-floating-promises` warning on `bootstrap()`), `@ocr/types` (0 errors).

---

## Shared Prettier Config

**Branch:** shared-prettier-config
**Completed:** 2026-06-12

### Goals

- Create `packages/prettier-config/` (`@ocr/prettier-config`) exporting a single config as default
- Backend `.prettierrc` deleted, replaced by `"prettier": "@ocr/prettier-config"` in package.json
- Frontend and `packages/types` gain `prettier ^3`, shared config reference, and `format` script
- `prettier --check` resolves without errors in all three consumers
- `pnpm --filter backend lint` still passes

### Summary

Created `@ocr/prettier-config` as a peer-dep-only package (mirrors `@ocr/eslint-config` pattern). Preserves existing backend settings: `singleQuote: true`, `trailingComma: 'all'`, adds `endOfLine: 'auto'` for Windows consistency. All consumers reference it via the `"prettier"` key in their `package.json`. Backend `.prettierrc` deleted. Pre-existing formatting issues in frontend and types are out of scope (no mass reformat). Backend lint passes (0 errors).

---

## Turbo Pipelines

**Branch:** turbo-pipelines
**Completed:** 2026-06-12

### Goals

- `turbo.json` defines `build`, `dev`, `lint`, `typecheck`, `test` with correct `dependsOn`, `cache`, and `outputs`
- `apps/backend/package.json` gains `"dev": "nest start --watch"` so `turbo dev` starts both apps
- Root `package.json` gains `"typecheck": "turbo typecheck"` and `"test": "turbo test"` scripts
- All four `turbo run` commands exit 0

### Summary

Replaced the skeleton `turbo.json` with a complete pipeline. `lint` set to `cache: false` (backend runs `--fix`). `typecheck` and `test` added with `dependsOn: ["^build"]`. `lint.dependsOn` kept as `[]` — type-aware ESLint rules resolve `@ocr/types` via tsconfig `paths` alias, no compiled output needed. Backend `dev` alias added. Removed `outputs: ["coverage/**"]` from `test` task after confirming the plain `jest` script doesn't produce coverage files. All four commands pass: `build` (frontend + backend), `lint` (frontend, backend, types), `typecheck` (types), `test` (backend 1/1).

---

## Race TypeORM Entity

**Branch:** race-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/race.entity.ts` — named `Race` class, `@Entity('races')`
- UUID primary key + 6 typed columns matching `RaceDto`, snake_case DB names
- `raceType` typed as `RaceDto['raceType']`, stored as `varchar`
- All numeric constraints in named `const`s, no audit columns
- `build` and `lint` pass

### Summary

Created `Race` entity with all columns matching `RaceDto`. `raceType` stored as `varchar(20)` for flexibility. Properties use definite assignment (`!`) since TypeORM initialises them. Also fixed `packages/types/src/index.ts` to use `.js` extensions on relative imports — required by `module: nodenext` after `"type": "module"` was added to the types package in step 4. Build and lint pass with 0 errors.

---

## Athlete TypeORM Entity

**Branch:** athlete-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/athlete.entity.ts` — named `Athlete` class, `@Entity('athletes')`
- UUID primary key + 4 typed columns matching `AthleteDto`, snake_case DB names (`first_name`, `last_name`)
- `category` typed as `AthleteDto['category']`, stored as `varchar`
- All varchar lengths extracted to named `const`s (255), no magic numbers
- `build` and `lint` pass

### Summary

Created `Athlete` entity following Race entity conventions exactly. All five columns use `varchar` with named length constants. `firstName` and `lastName` get explicit `name:` overrides for snake_case DB columns. `category` typed via `AthleteDto['category']` for DTO alignment without introducing a Postgres enum. Build and lint pass with 0 errors.

---

## RaceResult TypeORM Entity

**Branch:** race-result-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/race-result.entity.ts` — named `RaceResult` class, `@Entity('race_results')`
- UUID primary key
- FK → `Race`: unidirectional `@ManyToOne` + `@JoinColumn({ name: 'race_id' })` + scalar `raceId: string`
- FK → `Athlete`: unidirectional `@ManyToOne` + `@JoinColumn({ name: 'athlete_id' })` + scalar `athleteId: string`
- Result columns: `overallPosition`, `finishTimeSeconds`, `status`, `categoryPosition`, `genderPosition`
- `status` as `varchar` union (`'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`), default `'FINISHED'`
- All lengths in named constants, build and lint pass

### Summary

Created `RaceResult` as the join/fact table between `Race` and `Athlete`. Relations are unidirectional from `RaceResult` — no changes to existing entities. Each FK has both a relation property and a scalar uuid column for projection ergonomics. Nullable int columns for positions and finish time; status stored as varchar with a default. Build and lint pass with 0 errors.

---

## ObstacleSplit TypeORM Entity

**Branch:** obstacle-split-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/obstacle-split.entity.ts` — named `ObstacleSplit` class, `@Entity('obstacle_splits')`
- UUID primary key
- FK → `RaceResult`: unidirectional `@ManyToOne` + `@JoinColumn({ name: 'race_result_id' })` + scalar `raceResultId: string`
- `obstacleNumber: number` — 1-based ordinal, int
- `obstacleName: string` — varchar(255), named constant
- `splitTimeSeconds: number | null` — nullable int, per-obstacle duration in seconds
- `penaltyCount: number` — int, default 0 (count from CSV; boolean `penalty` column dropped as redundant)
- Build and lint pass

### Summary

Created `ObstacleSplit` as the per-obstacle fact table linked to `RaceResult` (not directly to Race/Athlete). Relation is unidirectional — no changes to existing entities. Dropped the specced boolean `penalty` column in favour of `penaltyCount` alone (count > 0 implies a penalty, avoids redundancy). `splitTimeSeconds` stores per-obstacle duration. Build and lint pass with 0 errors.

---

## Database Connection Module (TypeORM + Config)

**Branch:** database-connection-module
**Completed:** 2026-06-13

### Goals

- `ConfigModule.forRoot({ isGlobal: true })` registered in `app.module.ts`
- `TypeOrmModule.forRootAsync` injecting `ConfigService`, reading `DB_*` env vars
- `type: 'postgres'`, `synchronize: false`, `autoLoadEntities: true`, 4 entities registered
- `DB_PORT` parsed to a number
- Live Postgres connection verified on `start:dev`; build and lint pass

### Summary

Wired TypeORM into `app.module.ts` via `forRootAsync` reading connection params from `@nestjs/config`. All four entities registered explicitly with `autoLoadEntities: true` and `synchronize: false`. `DB_PORT` parsed with `Number(...) || DEFAULT_DB_PORT`. `logging: ['error']`.

Also resolved a build toolchain blocker discovered while verifying the live connection: removing the `@ocr/types` `paths` alias (TS now resolves it through `node_modules` as a library, fixing TS6059 in watch mode), and disabling `incremental` compilation which conflicted with nest-cli's `deleteOutDir: true` (stale `.tsbuildinfo` caused the watcher to skip emitting `dist/main.js`). `typeorm` pinned to `^0.3.20`. Added `packages/types/.gitignore` for compiled artifacts emitted alongside source. Connection verified: `TypeOrmCoreModule dependencies initialized` with no errors against Docker Postgres on 5433.

---

## Multer CSV Upload Configuration

**Branch:** multer-csv-upload
**Completed:** 2026-06-13

### Goals

- `csv-upload.config.ts` — `CSV_MULTER_OPTIONS` with memory storage, 10 MB file size limit, CSV-only file filter
- `ingestion.controller.ts` — empty `@Controller('ingest')` shell, no routes
- `IngestionController` wired into `IngestionModule` controllers array
- Build and lint pass

### Summary

Created `CSV_MULTER_OPTIONS` using `memoryStorage()` from multer. File filter accepts `mimetype === 'text/csv'` or `.csv` extension (handles Safari/curl sending CSV as `text/plain`); rejects with a descriptive `Error`. Dropped the explicit `: MulterOptions` annotation — multer 2.x doesn't export that name directly (`Options` lives inside the `multer` namespace); TypeScript infers the shape from the value, and `FileInterceptor` in step 19 validates compatibility at the call site. Empty `IngestionController` added to `IngestionModule` — step 19 adds the `POST /ingest/csv` method to it. Build and lint pass with 0 errors.

---

## Unit Tests for CSV Parsers (Steps 16 + 17)

**Branch:** csv-parser-unit-tests
**Completed:** 2026-06-13

### Goals

- `csv-metadata-parser.service.spec.ts` — happy-path, missing-field, invalid-value, and edge-case tests for `CsvMetadataParserService`
- `csv-rows-parser.service.spec.ts` — row-count, FINISHED mapping, DNS/DNF, penalty derivation, time formats, ordinal alignment, and error-branch tests for `CsvRowsParserService`
- All 48 tests pass with `pnpm --filter backend test`

### Summary

21 tests for `CsvMetadataParserService`: 5 happy-path parses against real fixtures (all 4 race types, `totalObstacles ≠ obstacles.length` for Super, decimal `distanceKm`), 7 missing-field errors (one per required label), 5 invalid-value errors (bad date format, NaN distance, non-integer obstacles, unknown raceType, empty obstacles), 4 edge cases (unknown label ignored, blank `#` line skipped, case-insensitive labels, case-insensitive raceType normalisation). Shared `VALID_HEADER` constant + `withoutField()` helper keep error tests DRY.

26 tests for `CsvRowsParserService`: row counts per fixture (22/20/19/19), FINISHED field mapping with exact second values (Chloe Thomas DEKA row), both time formats (`MM:SS` → 189s, `HH:MM:SS` → 4116s and 3706s), DNS and DNF rows (empty splits, null positions), penalty derivation (Ruby Anderson: Rope Climb + Multi Rig = index 5/15, others = 0), zero penalties for DEKA, ordinal split alignment (obstacleName from `metadata.obstacles[i]`, not slug), 18 splits for every Super FINISHED row, 3 error branches (cross-fixture metadata mismatch, missing column, invalid time string). Metadata produced by calling `CsvMetadataParserService.parseMetadata()` — no hand-crafted `RaceMetadata` objects.

---

## CSV Rows Parser (RaceResult + ObstacleSplit)

**Branch:** csv-rows-parser
**Completed:** 2026-06-13

### Goals

- Shared DTOs `ParsedObstacleSplit` and `ParsedRaceResult` in `packages/types/src/parsed-result.dto.ts`, re-exported from `index.ts` with `.js` specifier
- `CsvRowsParserService.parseRows(csv: string, metadata: RaceMetadata): ParsedRaceResult[]` in the existing `ingestion` module
- Parser skips `#` header block and column-header line; returns one result per data row
- Time parsing handles `HH:MM:SS` and `MM:SS` → integer seconds; DNS/DNF/DSQ rows produce `splits: []`
- Per-obstacle `penaltyCount` derived from `penalty_obstacles` semicolon-split name list
- Build and lint pass, zero `any`

### Summary

Created `ParsedObstacleSplit` and `ParsedRaceResult` interfaces in `@ocr/types` as the pure parser output types (no IDs, no entity references). `CsvRowsParserService` skips `#` lines, reads the column-header row dynamically, and processes each data row in order. Split columns are matched to `metadata.obstacles` by ordinal position (not by parsing the `split_` suffix — `Box Step-Ups` → `split_box_step-ups` doesn't round-trip). Both `MM:SS` and `HH:MM:SS` time formats handled in a single `parseTime` helper that branches on colon count. `genderPosition` always `null` (absent from CSV). DNS/DNF/DSQ rows produce `splits: []`. Penalty set built once per row from semicolon-split `penalty_obstacles` names; each named obstacle gets `penaltyCount: 1`. Registered in `IngestionModule` providers and exports. Build and lint pass with 0 errors.

---

## CSV Metadata Parser (RaceMetadata)

**Branch:** csv-metadata-parser
**Completed:** 2026-06-13

### Goals

- New shared DTO `RaceMetadata` in `packages/types/src/race-metadata.dto.ts`, re-exported from `index.ts` with a `.js` specifier
- New NestJS `ingestion` module under `apps/backend/src/ingestion/` (module + `CsvMetadataParserService`, no controller)
- `CsvMetadataParserService.parseMetadata(csv: string): RaceMetadata` — pure function, no FS/DB/network
- All 7 fields required; throws descriptive errors on missing/blank/invalid; unknown labels ignored
- `pnpm --filter backend build` and `pnpm --filter backend lint` pass, zero `any`

### Summary

Created `RaceMetadata` interface in `@ocr/types` reusing `RaceDto['raceType']` union (no duplication). Re-exported with `.js` specifier to keep the ESM package clean. Scaffolded `ingestion` feature module with `CsvMetadataParserService`: reads only leading `#` lines (stops at first non-`#` line), parses `label: value` pairs case-insensitively, maps 7 known labels to typed fields, ignores unknown labels and blank `#` lines. Number coercion uses `Number.isFinite` / `Number.isInteger` guards — no silent NaN. `raceType` matched case-insensitively and normalised to one of `Sprint | Super | DEKA | Open`. `IngestionModule` registered in `AppModule` (exports the service for future DI by the step-19 controller). Build and lint pass with 0 errors.

---

## Ingestion Endpoint Error Handling & Validation

**Branch:** ingestion-error-handling
**Completed:** 2026-06-13

### Goals

- `POST /ingest/csv` with no `file` field returns `400 Bad Request`
- Multer `fileFilter` rejection (wrong type) and `LIMIT_FILE_SIZE` both return `400`
- CSV parse failure (metadata or rows) returns `422 Unprocessable Entity` with the parser's error message
- DB transaction failure returns `500 Internal Server Error` with a safe generic message (original logged server-side)
- Parser calls and transaction wrapped in separate `try/catch` blocks — no cross-classification of error codes
- Unit tests: missing file → 400, parse failure → 422, DB failure → 500, happy path → 201
- `pnpm --filter backend lint`, `pnpm --filter backend build`, `pnpm --filter backend test` all pass

### Summary

Added `MulterExceptionFilter` (`@Catch(MulterError)`) registered via `@UseFilters` on `IngestionController` — maps `LIMIT_FILE_SIZE` to `BadRequestException`, other multer errors to `BadRequestException`. Updated `csv-upload.config.ts` to throw `BadRequestException` (not plain `Error`) in `fileFilter` so NestJS maps wrong-type uploads to 400. Added explicit `if (!file)` null guard in the controller. In `IngestionService`, split into two separate `try/catch` blocks: parser calls → `UnprocessableEntityException` (surfaces original parser message); `dataSource.transaction` → `InternalServerErrorException` with safe generic message + `Logger.error` for the full stack trace. Parser services unchanged — they still throw plain `Error`. Added `ingestion.service.spec.ts` (6 tests) and `ingestion.controller.spec.ts` (3 tests). All 57 tests pass.

---

## POST /ingest/csv Endpoint

**Branch:** ingest-csv-endpoint
**Completed:** 2026-06-13

### Goals

- New `apps/backend/src/ingestion/ingestion.service.ts` — `IngestionService.ingestCsv(fileBuffer: Buffer): Promise<{ raceId: string; rowsIngested: number }>` orchestrating parse → persist in a single transaction
- `IngestionController` updated with `@Post('csv')` route using `FileInterceptor('file', CSV_MULTER_OPTIONS)` and `@UploadedFile()`, returns HTTP 201
- `IngestionModule` updated: `TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit])` added to imports; `IngestionService` added to providers
- All entities saved atomically: Race → (per row) Athlete find-or-create → RaceResult → ObstacleSplit[] batch
- `pnpm --filter backend build` and `pnpm --filter backend lint` pass

### Summary

Created `IngestionService` with a `DataSource.transaction` call that saves Race first, then per-row does an Athlete find-or-create (read via injected repo outside the transaction manager, write via manager), then saves `RaceResult` and batches `ObstacleSplit[]` in a single `manager.save` call. Controller updated with `@Post('csv')`, `@HttpCode(HttpStatus.CREATED)`, and `@UseInterceptors(FileInterceptor(...))` — all HTTP concerns stay in the controller, all logic in the service. `IngestionModule` gains `TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit])` and `IngestionService` in providers. No `try/catch` added (error handling is step 20). Build and lint pass with 0 errors.

---