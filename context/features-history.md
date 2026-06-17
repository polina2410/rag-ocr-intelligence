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

## GET /races Endpoint — Paginated List of Races

**Branch:** get-races-endpoint
**Completed:** 2026-06-13

### Goals

- `packages/types/src/paginated.dto.ts` — `PaginatedResponse<T>` interface, re-exported from barrel with `.js` specifier
- `apps/backend/src/races/dto/list-races-query.dto.ts` — `page` (int, min 1, default 1) and `limit` (int, min 1, max 100, default 20) with `@Type(() => Number)` coercion
- `apps/backend/src/races/races.service.ts` — `findAll(page, limit)` using `findAndCount`, `date DESC`, `skip`/`take`, coerces `distanceKm` to number, returns `PaginatedResponse<RaceDto>`
- `apps/backend/src/races/races.controller.ts` — `@Controller('races')`, `@Get()` handler, delegates to service
- `apps/backend/src/races/races.module.ts` — `TypeOrmModule.forFeature([Race])`, registers controller and service
- `RacesModule` added to `AppModule` imports with `.js` suffix convention
- `GET /races` returns 200 `{ data: RaceDto[], total, page, limit }` ordered by `date DESC`
- Invalid params (`page=0`, `limit=101`, `limit=abc`) return 400 via global `ValidationPipe`
- Service unit tests: happy path + empty result + `distanceKm` coercion + skip/take + beyond-last-page
- `pnpm --filter backend lint`, `pnpm --filter backend build`, `pnpm --filter backend test` all pass

### Summary

Created full `RacesModule` stack: `ListRacesQueryDto` coerces string query params to integers via `@Type(() => Number)` (class-transformer already present); `RacesService.findAll` uses `findAndCount` with `order: { date: 'DESC' }`, `skip`/`take`, and maps each row with `Number(row.distanceKm)` to handle Postgres returning `numeric` as string. Added generic `PaginatedResponse<T>` to `@ocr/types` for reuse in steps 23/24. Fixed pre-existing `@typescript-eslint/unbound-method` lint error in `ingestion.controller.spec.ts` by hoisting the `jest.fn()` to a named variable and referencing it directly rather than accessing it through the typed mock object. 62 tests pass.

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

## GET /athletes/:id Endpoint

**Branch:** get-athlete-by-id
**Completed:** 2026-06-13

### Goals

- New `packages/types/src/athlete-detail.dto.ts` — `AthleteResultDto` and `AthleteDetailDto extends AthleteDto`
- `Athlete` entity gains `@OneToMany('RaceResult', 'athlete') results!`; `RaceResult.athlete` `@ManyToOne` updated with inverse arg
- `athletes.module.ts` expanded to `forFeature([Athlete, RaceResult, Race, ObstacleSplit])`
- `AthletesService.findOne(id)` — loads `results → race` and `results → splits`, 404 on miss, `distanceKm` coerced
- `@Get(':id')` with `ParseUUIDPipe` — 400 on bad UUID, 404 on miss
- Results by race `date` DESC; splits by `obstacleNumber` ASC
- 8 new `findOne` unit tests (83 total); lint, build, tests all pass

### Summary

Added `GET /athletes/:id` returning `AthleteDetailDto` — the inverse of `GET /races/:id`: athlete is the root, each result embeds the parent `RaceDto` (with `distanceKm: Number(...)`) plus `ObstacleSplitDto[]`. Added `@OneToMany('RaceResult', 'athlete')` to `Athlete` entity (string-based ref to avoid circular imports) and updated `RaceResult.athlete` `@ManyToOne` with the inverse function arg. `athletes.module.ts` expanded to register all four entities. Results sorted by race `date` DESC via `localeCompare`; splits by `obstacleNumber` ASC. `AthleteResultDto` and `AthleteDetailDto` added to `@ocr/types` with `.js` re-export. 83 tests pass across 7 suites.

---

## EmbedService — Batch Embed a Race and Upsert Vectors to Qdrant

**Branch:** batch-embed
**Completed:** 2026-06-14

### Goals

- `EmbedService.batchEmbedRace(raceId: string): Promise<void>` — loads all `RaceResult` rows with `race`, `athlete`, `splits` relations; serializes; embeds; upserts
- Empty result set → early return, no `upsert` call
- `QdrantPoint` payload: `{ raceResultId, raceId, athleteId, athleteName, raceName, raceDate }`
- `EmbedService` constructor gained 3 new deps: `@InjectRepository(RaceResult)`, `RaceResultSerializerService`, `VectorStoreService`
- `EmbedModule` updated: imports `TypeOrmModule.forFeature([RaceResult])` + `VectorStoreModule`; provides `RaceResultSerializerService`
- `IngestionService` calls `await this.embedService.batchEmbedRace(raceId)` after the transaction
- 112/112 tests pass

### Summary

Extended `EmbedService` with `batchEmbedRace`: loads all `RaceResult` rows for a `raceId` with full relations, serializes each via `RaceResultSerializerService`, embeds via `embed()`, builds `QdrantPoint[]` with attribution payload, upserts once via `VectorStoreService`. `EmbedModule` now imports `VectorStoreModule` and `TypeOrmModule.forFeature([RaceResult])`; `RaceResultSerializerService` registered directly as a provider (no separate module). `IngestionModule` imports `EmbedModule`; `IngestionService` gets `EmbedService` injected and calls `batchEmbedRace` synchronously after the transaction (a one-liner, trivially replaced by a Bull job in step 38–39). Updated `embed.service.spec.ts` constructor call sites; added 3 new `batchEmbedRace` tests. Updated `ingestion.service.spec.ts` to mock `EmbedService`. 112/112 tests pass, build clean.

---

## EmbedService — Embed a Single Text Chunk via OpenAI

**Branch:** embed-service
**Completed:** 2026-06-14

### Goals

- `OPENAI_CLIENT` injection token and `EMBEDDING_MODEL = 'text-embedding-3-small'` in `embed.constants.ts`
- `EmbedService.embed(text: string): Promise<number[]>` — calls `client.embeddings.create`, returns `response.data[0].embedding`
- Errors propagate — no try/catch
- `EmbedModule` registers `OPENAI_CLIENT` via `ConfigService.getOrThrow('OPENAI_API_KEY')`; exports `EmbedService` only
- `EmbedModule` wired into `AppModule`
- Co-located spec: happy path + error propagation; 109/109 tests pass

### Summary

Created `apps/backend/src/embed/` with four files following the `VectorStoreModule` DI pattern. `OPENAI_CLIENT` is a custom injection token; the factory reads `OPENAI_API_KEY` via `ConfigService.getOrThrow` and instantiates `new OpenAI(...)` — the service never touches the constructor. `embed()` is a one-liner: call `embeddings.create`, return `response.data[0].embedding`. `EmbedModule` exports only `EmbedService` (not the raw client token). Registered in `AppModule`. 109/109 tests pass, build clean.

---

## Text Serializer — RaceResult to Natural Language Chunk

**Branch:** text-serializer
**Completed:** 2026-06-14

### Goals

- `RaceResultSerializerService` with `serialize(result: RaceResult): string` — pure, synchronous, `@Injectable()`
- Output includes athlete full name, nationality, category, race name, date, location, distance (km), race type
- `FINISHED`: finish time as `H:MM:SS` / `MM:SS`; non-null positions only (null omitted entirely)
- `DNF` / `DNS` / `DSQ`: status stated in words; no finish time or position claimed
- Splits rendered sorted by `obstacleNumber`; obstacle name + split time (when non-null) + penalty count (when > 0)
- Splits with `splitTimeSeconds === null` still appear by name — not silently dropped
- Empty `splits` array returns valid string with no crash
- 106/106 tests pass

### Summary

Created `apps/backend/src/serializer/race-result-serializer.service.ts` with `RaceResultSerializerService.serialize()`. The method builds three prose clauses — athlete (name, nationality, category), race (name, date, location, distance, type, obstacle count), and result (status-branched: finish time + non-null positions for FINISHED; status in words for DNF/DNS/DSQ) — then appends an obstacle-splits sentence from a sorted copy of `splits`. Private `formatDuration` helper produces `H:MM:SS` when ≥ 1 hour, `MM:SS` otherwise. `SECONDS_PER_HOUR` and `SECONDS_PER_MINUTE` named constants; `distanceKm` coerced with `Number()`. No module wiring (deferred to step 30). Co-located spec covers 14 test cases across all branches and edge cases. 106/106 tests pass, lint clean.

---

## VectorStoreService Query

**Branch:** vector-store-query
**Completed:** 2026-06-13

### Goals

- `query(vector: number[], topK: number): Promise<QdrantResult[]>` implemented — stub removed, parameters used (no underscores)
- Calls `this.client.search(RACE_RESULTS_COLLECTION, { vector, limit: topK, with_payload: true })`
- Each `ScoredPoint` mapped: `id: String(hit.id)`, `score: hit.score`, `payload: hit.payload ?? {}`
- Errors from the client propagate unchanged (no try/catch)
- Existing 3 upsert tests still pass unchanged
- 5 new tests in a `describe('VectorStoreService.query')` block: happy path, empty result, null payload → `{}`, numeric id → `'42'`, error propagation
- `mockClient` extended with `search: jest.fn()` alongside existing `upsert: jest.fn()`

### Summary

Replaced the `Promise.reject` stub in `VectorStoreService.query` with a real implementation: calls `this.client.search(RACE_RESULTS_COLLECTION, { vector, limit: topK, with_payload: true })` and maps each `ScoredPoint` to `{ id: String(hit.id), score: hit.score, payload: hit.payload ?? {} }`. No try/catch — errors propagate unchanged. Extended the existing spec file's `mockClient` with `search: jest.fn()` and added 5 tests covering happy path (mapped fields), empty result, null payload coercion, numeric id string coercion, and error propagation. 91/91 tests pass.

---

## VectorStoreService Upsert

**Branch:** vector-store-upsert
**Completed:** 2026-06-13

### Goals

- `upsert(points: QdrantPoint[]): Promise<void>` implemented — calls `client.upsert` with `RACE_RESULTS_COLLECTION`, `wait: WAIT_FOR_UPSERT`, and mapped points
- Empty-array guard returns early without calling the client
- Logger debug line records point count
- 3 tests: happy path, empty input, error propagation — all pass
- `moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" }` added to Jest config to resolve intra-module `.js` imports in ts-jest
- Build and lint clean; 86/86 tests pass

### Summary

Replaced the `Promise.reject` stub in `VectorStoreService.upsert` with a real implementation: empty-array guard, `.map` to `{ id, vector, payload }` shape, `await this.client.upsert(RACE_RESULTS_COLLECTION, { wait: WAIT_FOR_UPSERT, points })`, and a debug log. `WAIT_FOR_UPSERT = true` defined as a named constant above the class. Created `vector-store.service.spec.ts` with 3 tests mocking `QdrantClient` as `{ upsert: jest.fn() }`. Also added `moduleNameMapper` to the backend Jest config — this was required because `vector-store.service.ts` is the first service in the project to use a `.js` extension for an intra-module import (the constants file), which ts-jest in CJS mode cannot resolve without explicit mapping.

---

## Qdrant Collection Setup

**Branch:** qdrant-collection-setup
**Completed:** 2026-06-13

### Goals

- `vector-store.constants.ts` exports `QDRANT_CLIENT` token, `RACE_RESULTS_COLLECTION = 'race_results'`, `EMBEDDING_DIMENSION = 1536`, `VECTOR_DISTANCE: Schemas['Distance'] = 'Cosine'`
- `VectorStoreModule` registers `QdrantClient` via `useFactory` (reads `QDRANT_URL`/`QDRANT_API_KEY` from `ConfigService`); exports `VectorStoreService` and `QDRANT_CLIENT`
- `VectorStoreService` implements `OnModuleInit` — idempotently creates `race_results` collection via `collectionExists()` → `createCollection()`; logs outcome; stub `upsert`/`query` methods
- `VectorStoreModule` wired into `AppModule` with `.js`-suffix path
- Build, lint, and 83/83 tests pass

### Summary

Created `apps/backend/src/vector-store/` with three files. `vector-store.constants.ts` holds all four named constants — `VECTOR_DISTANCE` typed as `Schemas['Distance']` (the correct type from `@qdrant/js-client-rest`) to avoid bare-string issues. `VectorStoreModule` registers `QdrantClient` as a custom `QDRANT_CLIENT` provider via `useFactory` injecting `ConfigService` (`getOrThrow` for the required URL). `VectorStoreService` calls `collectionExists()` in `onModuleInit` and only calls `createCollection` if absent — safe across restarts. Stub `upsert`/`query` methods return `Promise.reject` (not `async` with no `await`) to satisfy the `require-await` lint rule while preserving the async signature for steps 27–28. `VectorStoreModule` added to `AppModule` imports.

---

## Swagger / OpenAPI Documentation

**Branch:** swagger-openapi-documentation
**Completed:** 2026-06-13

### Goals

- `GET /docs` serves Swagger UI via `SwaggerModule` wired in `main.ts`
- 9 backend Swagger response classes in `apps/backend/src/common/swagger/` and `ingestion/dto/`, each `implements` its shared interface for compile-time drift protection
- Paginated schemas (`PaginatedRacesResponseDto`, `PaginatedAthletesResponseDto`) reference real item types
- `@ApiPropertyOptional` on both query DTOs (`page`, `limit`) with type, min, max, and default
- All 5 endpoints annotated with `@ApiTags`, `@ApiOperation`, typed response decorators, `@ApiParam` (UUID format), `@ApiBadRequestResponse` (ingest), `@ApiNotFoundResponse` (`:id` lookups)
- `POST /ingest/csv` has `@ApiConsumes('multipart/form-data')` + `@ApiBody` (file picker in UI)
- Build and lint clean; 83/83 tests pass

### Summary

Added full Swagger documentation to the NestJS backend. Shared types in `@ocr/types` are plain interfaces and cannot carry decorators, so introduced backend-only Swagger response classes — each `implements` its corresponding shared interface so shape drift is caught at compile time. Created `apps/backend/src/common/swagger/` for the 9 response classes (`AthleteResponseDto`, `RaceResponseDto`, `ObstacleSplitResponseDto`, `RaceResultResponseDto`, `RaceDetailResponseDto`, `AthleteResultResponseDto`, `AthleteDetailResponseDto`, `PaginatedRacesResponseDto`, `PaginatedAthletesResponseDto`) and `apps/backend/src/ingestion/dto/ingest-csv-response.dto.ts`. Nullable fields use `nullable: true`; enums (`raceType`, `status`) documented as string arrays. Paginated shapes use concrete subclasses (one per item type) to avoid generic-resolution issues in OpenAPI. `main.ts` bootstraps `DocumentBuilder` + `SwaggerModule.setup('docs', ...)`. `void bootstrap()` added to satisfy the no-floating-promises lint rule.

---

## GET /athletes Endpoint

**Branch:** get-athletes-endpoint
**Completed:** 2026-06-13

### Goals

- New `AthletesModule` with `TypeOrmModule.forFeature([Athlete])`, controller, and service
- `AthletesModule` wired into `AppModule` imports with `.js`-suffix path
- `AthletesController` — `@Controller('athletes')`, `@Get()` handler returning `Promise<PaginatedResponse<AthleteDto>>`
- `AthletesService.findAll(page, limit)` — `order: { lastName: 'ASC', firstName: 'ASC' }`, no numeric coercion
- `ListAthletesQueryDto` — `page`/`limit` with `@Type(() => Number)`, `@IsInt`, `@Min`/`@Max`, defaults
- `GET /athletes` → 200 with `PaginatedResponse<AthleteDto>`; invalid params → 400
- 5 unit tests; lint, build, and tests all pass

### Summary

Created full `AthletesModule` stack mirroring the `GET /races` pattern exactly. `ListAthletesQueryDto` is a direct copy of `ListRacesQueryDto` (same constants, same decorators). `AthletesService.findAll` uses `findAndCount` with `order: { lastName: 'ASC', firstName: 'ASC' }` and maps rows to `AthleteDto` with a straight field copy — no `Number()` coercion since `Athlete` has no `numeric` columns. `AthletesModule` registered in `AppModule` with `.js`-suffix import path. No changes to `packages/types/` — `AthleteDto` and `PaginatedResponse<T>` were already exported. 75 tests pass across 7 suites.

---

## GET /races/:id Endpoint

**Branch:** get-race-by-id
**Completed:** 2026-06-13

### Goals

- New `packages/types/src/race-detail.dto.ts` with `ObstacleSplitDto`, `RaceResultDto`, and `RaceDetailDto`
- `packages/types/src/index.ts` updated with `export * from './race-detail.dto.js'`
- `RacesService.findOne(id)` loads race + results + athlete + splits, throws `NotFoundException` on miss, coerces `distanceKm` to number
- `RacesController` `@Get(':id')` handler with `ParseUUIDPipe` (400 on bad UUID)
- `races.module.ts` expanded to register `Race`, `RaceResult`, `ObstacleSplit`, `Athlete`
- `GET /races/{validUuid}` → 200 with full `RaceDetailDto` (results, athlete, splits)
- `GET /races/{unknownUuid}` → 404; `GET /races/{nonUuid}` → 400
- 7 new `findOne` unit tests (70 total); lint, build, and tests all pass

### Summary

Added `GET /races/:id` returning a full `RaceDetailDto` including the nested result graph (results → athlete, results → splits). Added `@OneToMany` inverse relations on `Race` (→ `RaceResult[]`) and `RaceResult` (→ `ObstacleSplit[]`) using string-based entity references to avoid circular value imports; wired back-references on `@ManyToOne` decorators. `RacesService.findOne` loads via `relations: ['results', 'results.athlete', 'results.splits']`, sorts results by `overallPosition` asc nulls-last and splits by `obstacleNumber` asc, coerces `distanceKm` with `Number()`. `ParseUUIDPipe` on the `:id` param yields 400 for non-UUID inputs. `races.module.ts` expanded to register all four entities. `ObstacleSplitDto`, `RaceResultDto`, and `RaceDetailDto extends RaceDto` added to `@ocr/types` with `.js` re-export. 70 tests pass, 0 errors.

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

## RetrieveService — Embed Query and Fetch Top-K Chunks (Step 32)

**Branch:** retrieve-service
**Completed:** 2026-06-14

### Goals

- Shared `RaceResultPayload` interface in `vector-store.service.ts`, reused on both the upsert (`EmbedService.batchEmbedRace`) and retrieve sides to prevent payload key drift
- `RetrieveService.retrieve(query: string, topK?: number): Promise<RetrievedChunk[]>` — embeds the query once via `EmbedService.embed`, fetches top-k via `VectorStoreService.query`
- Each `QdrantResult` mapped to a typed `RetrievedChunk` (`{ id; score; metadata: RaceResultPayload }`) — `Record<string, unknown>` → typed conversion once, at the service boundary
- Named `DEFAULT_TOP_K = 5` constant
- `RetrieveModule` imports `EmbedModule` + `VectorStoreModule`, provides/exports `RetrieveService`, not registered in `app.module.ts` (deferred to step 36)
- `retrieve.service.spec.ts` covers happy path, metadata mapping, default topK, explicit topK, empty results, embed-error and query-error propagation
- Lint, test (119/119), and build all pass

### Summary

Created `apps/backend/src/retrieve/` (service + module + spec). `RetrieveService.retrieve` calls `EmbedService.embed(query)` once, passes the vector to `VectorStoreService.query(vector, topK)`, and maps each hit to a `RetrievedChunk`. Extracted a shared `RaceResultPayload` interface into `vector-store.service.ts` (alongside `QdrantPoint`/`QdrantResult`) and typed `EmbedService.batchEmbedRace`'s payload with it — one source of truth for the payload contract across upsert and retrieve. Two intentional boundary casts handle the TS interface-vs-index-signature quirk: `RaceResultPayload` → `Record<string, unknown>` at upsert, and back at retrieve. Resolved a pre-existing red lint gate: `embed.service.spec.ts` (and the new retrieve spec) were failing `@typescript-eslint/unbound-method` on the jest mock idiom — rewrote both to a standalone-const mock harness (assert against captured `jest.fn()`s, not `obj.method`) rather than disabling the rule. 6 retrieve tests including embed-error and query-error propagation (the latter added during review). **Known gap for step 33:** the Qdrant payload stores only IDs/names/date, not the serialized chunk text — the prompt builder will need to re-serialize from Postgres via `raceResultId` or add a `text` field at upsert time. 119/119 tests pass, build and lint clean.

---

## Prompt Builder — RAG Context Assembly (Step 33)

**Branch:** prompt-builder
**Completed:** 2026-06-14

### Goals

- Store serialized chunk text in the Qdrant payload: add `text: string` to `RaceResultPayload`, populate `text: chunk` in `EmbedService.batchEmbedRace`, update the embed spec assertion
- `PromptBuilderService.buildMessages(query, chunks): ChatCompletionMessageParam[]` — pure, zero dependencies: a system message (instructions + numbered context block) + a user message (raw query)
- Named constants for system/no-data instructions, context header, delimiter, message count
- Empty chunks → no-data instruction (anti-hallucination), no context block
- Tolerate missing/empty `metadata.text` on a chunk (older points predate the field) — skip without crashing
- `PromptModule` providing/exporting the service
- Spec: chunk text in order, query verbatim, empty path, missing-text skip, all-unusable → no-data, output shape
- Lint, test (125/125), and build all pass

### Summary

Resolved the step-32 known gap by storing the serialized chunk text in the Qdrant payload (chosen over re-serializing from Postgres): added `text: string` to `RaceResultPayload` and populated it in `EmbedService.batchEmbedRace` from the already-computed `chunk` variable (no recomputation). Created `apps/backend/src/prompt/` (service + module + constants + spec). `PromptBuilderService.buildMessages` is a pure function of `(query, chunks)` — it filters chunks to those with usable `text`, numbers them under `SYSTEM_INSTRUCTION` into a context block, and returns `[system, user]` as `ChatCompletionMessageParam[]` (the OpenAI SDK type, accessed via the `OpenAI.Chat.Completions` namespace off the default import to avoid subpath-resolution risk). When no usable context remains it returns `NO_CONTEXT_INSTRUCTION` instead, instructing the model not to hallucinate. Return type is `ChatCompletionMessageParam[]` so step-34 GenerateService can pass it straight to `client.chat.completions.create({ messages })` with no adapter layer. Token-budget truncation of the context is noted as a future concern in a code comment, not implemented. **Migration note:** races ingested before this change lack `text` in their payload (`metadata.text` is `undefined` at runtime until re-ingested); the builder skips such chunks, covered by tests. 6 new prompt-builder tests; 125/125 tests pass, build and lint clean.

---

## GenerateService — Streaming LLM + Shared OpenAiModule (Step 34)

**Branch:** generate-service
**Completed:** 2026-06-14

### Goals

- Extract a shared `OpenAiModule` (`openai/openai.module.ts` + `openai/openai.constants.ts`) that provides + exports the `OPENAI_CLIENT` token; both `EmbedModule` and `GenerateModule` import it (single client instance)
- Move `OPENAI_CLIENT` out of `embed.constants.ts` (keep `EMBEDDING_MODEL`); repoint `embed.service.ts`; refactor `EmbedModule` to import `OpenAiModule` and drop its inline provider — `EmbedService` behavior unchanged
- `CHAT_MODEL = 'gpt-4o-mini'` named constant
- `GenerateService.generate(messages): AsyncGenerator<string>` — streaming `chat.completions.create({ model, messages, stream: true })`, yields each non-empty `delta.content`, errors propagate unwrapped
- `GenerateModule` imports `OpenAiModule`, provides + exports `GenerateService`
- Spec: create-args, ordered deltas, null/undefined/empty skip, empty stream, open-error and mid-stream-throw propagation
- Lint, test (131/131), and build all pass

### Summary

Extracted a shared `OpenAiModule` owning the `OPENAI_CLIENT` token + its `useFactory` (moved verbatim from `EmbedModule`), so one OpenAI client instance now serves embed + generate. `EmbedModule` imports it and dropped its inline provider; `OPENAI_CLIENT` moved to `openai/openai.constants.ts` (only `EMBEDDING_MODEL` stays in embed, `CHAT_MODEL` lives with generate — model names stay next to their consumer). The refactor is DI-wiring only; `embed.service.spec.ts` constructs the service with a mock client and was unaffected. Created `apps/backend/src/generate/` — `GenerateService.generate` is an `async *` generator that opens a streaming chat completion and yields each non-empty `chunk.choices[0]?.delta?.content`, guarding null/undefined/empty; errors propagate unwrapped. `ChatCompletionMessageParam` accessed via the `OpenAI` namespace (matching the prompt builder). Two review-driven type-safety improvements applied: `CHAT_MODEL` typed with `satisfies OpenAI.ChatModel` (typo/autocomplete guard — `'gpt-4o-mini'` confirmed in the SDK union), and the test's fake stream typed as `ChatCompletionChunk` (full shape, not naive `Partial`) so mock drift is caught at compile time. 6 new generate tests including open-error and mid-stream-throw propagation. **Caveat:** Context7 was unauthenticated this session, so the streaming pattern came from the stable v6 SDK, not freshly fetched docs. `GenerateModule` is exported for step 35 to import; not yet registered in `app.module.ts` (deferred until a consumer exists). 131/131 tests pass, build and lint clean.

---

## SSE Stream Handler — writeSse (Step 35)

**Branch:** sse-stream-handler
**Completed:** 2026-06-14

### Goals

- `common/sse/sse-stream.ts` — `writeSse(res: Response, tokens: AsyncIterable<string>, onClose?): Promise<void>`, decoupled from `GenerateService` (generic over `AsyncIterable<string>`); manual Express streaming, NOT `@Sse()`
- `common/sse/sse-stream.constants.ts` — named constants for SSE headers, field labels, `done`/`error` events, `[DONE]` sentinel, frame terminator, safe error message, `'close'` event
- 4 headers + `flushHeaders()` before first write; each token → `data: ${JSON.stringify(token)}\n\n` in order; completion → `done` event + `res.end()` once
- Mid-stream error → `Logger.error` full server-side, safe `error` frame (no leak), end, no rethrow
- Client disconnect (`res.on('close')`) → break iteration; guarded `safeWrite`/`safeEnd` + `finally` so the response always closes and end is idempotent
- Optional `onClose` hook fires once on premature disconnect (not normal completion) for step-36 `AbortController` wiring
- Spec: header ordering, ordered JSON frames, done+end, empty stream, error path, disconnect stops iteration, onClose fires on disconnect / not on completion
- Lint, test (139/139), and build all pass

### Summary

Created `apps/backend/src/common/sse/` — a reusable, framework-light SSE writer used by step 36's `POST /ask` controller. `writeSse` sets the streaming headers (`text/event-stream`, `no-cache`, `keep-alive`, `X-Accel-Buffering: no`), flushes, then writes each token as a JSON-encoded `data:` frame (JSON encoding so newlines/quotes can't break framing), emits a terminal `done` event, and ends. Mid-stream errors are logged in full server-side via Nest `Logger` and surfaced to the client as a generic `error` frame with no internal detail; the function resolves rather than rethrowing (the response is already committed once streaming starts). It is decoupled from the LLM layer — generic over `AsyncIterable<string>`. A devil's-advocate review drove two hardening changes: (1) all writes/ends route through guarded `safeWrite`/`safeEnd` helpers with a `finally`, guaranteeing the response closes even if the catch block throws and making `end()` idempotent; (2) an optional `onClose?: () => void` hook that fires once on *premature* client disconnect (guarded by an `ended` flag so a normal completion's trailing `close` doesn't trigger it) — step 36 will wire this to an `AbortController` so a disconnect cancels the in-flight OpenAI request immediately instead of at the next token boundary. 8 unit tests (standalone-const harness, mocked Express `Response`, fake async-generator sources; safe-error proven via `expect.not...stringContaining`). **Deferred (known limitations):** no keepalive heartbeat (aggressive proxies may close idle connections during the pre-first-token wait — flag for step-36 e2e under slow-network); full disconnect→OpenAI-abort lands in step 36 by threading an `AbortSignal` into `GenerateService.generate` and wiring `onClose`. 139/139 tests pass, build and lint clean.

---

## POST /ask Endpoint — RAG Pipeline Wiring (Step 36)

**Branch:** ask-endpoint
**Completed:** 2026-06-14

### Goals

- Extend `GenerateService.generate(messages, signal?: AbortSignal)` — `signal` passed in the OpenAI request options (2nd arg), not the body; no behavior change when omitted
- Update `generate.service.spec.ts` for the options arg + add a signal-forwarding test
- `AskQueryDto { query }` (`@IsString`/`@IsNotEmpty`/`@MaxLength(1000)` + Swagger)
- `AskController` `@Post('ask')` orchestrating retrieve → buildMessages → `AbortController` → `writeSse(res, generate(messages, signal), () => ctrl.abort())`; `@Res()` handler returns void; Swagger documents the SSE response in prose
- `AskModule` imports `RetrieveModule` + `PromptModule` + `GenerateModule`; registered in `app.module.ts`
- `ask.controller.spec.ts` mocking `writeSse`; validation → 400
- Lint, test (145/145), and build all pass

### Summary

Final step of Phase 3 — `POST /ask` runs the full RAG pipeline end-to-end. The controller retrieves chunks, builds the prompt, then streams the OpenAI completion via the step-35 `writeSse` helper. Orchestration order is load-bearing: `retrieve` (await) and `buildMessages` (sync) run before any streaming so their errors propagate to Nest's exception filter as normal JSON 4xx/5xx (the response isn't committed yet); only the `generate` stream is wrapped by `writeSse`'s safe `error` frame. Closed the step-35 devil's-advocate Objection 1 by threading an `AbortSignal` through `GenerateService.generate` (passed as the OpenAI request options 2nd arg, `create(body, { signal })`) and wiring the controller's `AbortController` to `writeSse`'s `onClose` — a mid-stream client disconnect now aborts the in-flight OpenAI request immediately. `AskModule` brings `GenerateModule`/`OpenAiModule` into the DI graph for the first time. Logic kept in the controller (thin-controller convention, no `AskService`); `AskQueryDto` validated with class-validator (empty/over-length/extra-prop → 400 via the global `ValidationPipe`). Controller unit-tested by direct construction with mocked services and a `jest.mock`-ed `writeSse`, asserting the wiring and the pre-stream error path (retrieve rejects → `writeSse` never called). 6 new tests (5 controller + 1 generate signal-forwarding). **Deferred (known minor):** every client cancel logs `error`-level noise in `writeSse`'s catch (the abort error) — optional one-line `debug`-when-`closed` refinement left for later; SSE keepalive heartbeat still not implemented (flag for e2e under slow proxies). 145/145 tests pass, build and lint clean.

---

## BullMQ Queue Module with Redis Connection (Step 37)

**Branch:** bull-queue-module
**Completed:** 2026-06-14

### Goals

- Add `redis:7-alpine` service (`ocr_redis`, `6379:6379`, `redis_data` volume) to `docker-compose.yml`
- Install `@nestjs/bullmq` + `bullmq`; add `REDIS_HOST`/`REDIS_PORT` to root `.env.example` (docs) + `apps/backend/.env` (runtime)
- `queue/queue.constants.ts` — `EMBED_QUEUE = 'race-embed'`
- `queue/queue.module.ts` — `QueueModule`: `BullModule.forRootAsync` (connection from `ConfigService`) + `registerQueue({ name: EMBED_QUEUE })` + `exports: [BullModule]`, registered once in `app.module.ts`
- Build + lint + 145 tests pass; boot connects to Redis
- No processor (38), no ingestion enqueue (39)

### Summary

Queue INFRASTRUCTURE only — the producer/consumer come in steps 38/39. Chose **BullMQ** (`@nestjs/bullmq@^11.0.4` + `bullmq@^5.78.1`) over legacy Bull (Bull is in maintenance mode); BullMQ uses a `connection` object (ioredis options), not Bull's `redis` key. Added a `redis:7-alpine` service + `redis_data` volume to compose. `QueueModule` calls `BullModule.forRootAsync` (host/port from `ConfigService.getOrThrow`, `REDIS_PORT` coerced via `Number`) and `registerQueue({ name: EMBED_QUEUE })`, exporting `BullModule`; it is imported once in `AppModule` so `forRoot` runs exactly once — steps 38/39 import `QueueModule` (singleton) to reach the queue without re-running root config. The queue name lives in the `EMBED_QUEUE` constant (no magic string). Verified the BullMQ API (`forRootAsync`/`registerQueue`/`connection`) directly against the installed `@nestjs/bullmq` types since Context7 was unavailable. **Two env surfaces:** docker-compose interpolates from the repo-root env file while the Nest app reads `apps/backend/.env` — the Redis vars were added to both (root `.env.example` for docs/visibility; `apps/backend/.env`, untracked, for runtime). No unit test was added — pure DI/connection wiring is verified by the boot check: with `docker compose up -d` the app initialized `QueueModule` + all `BullModule` instances with zero Redis errors and Redis answered `PONG`. **Post-completion infra fix:** the Qdrant 401 seen during this step's boot check was a local credential drift (the `ocr_qdrant` container was created with an empty `QDRANT__SERVICE__API_KEY` because no root `.env` existed at the time). Resolved by adding a gitignored root `.env` with the matching key and force-recreating ONLY the Qdrant container (data volume preserved) — Postgres untouched. App now boots clean end-to-end. 145/145 tests pass, build and lint clean.

---

## BullMQ Embed Job Processor (Step 38)

**Branch:** embed-processor
**Completed:** 2026-06-14

### Goals

- `queue/embed-job.types.ts` — `EmbedJobData { raceId: string }` shared with the step-39 producer
- `embed/embed.processor.ts` — `@Processor(EMBED_QUEUE)` `EmbedProcessor extends WorkerHost`: `process(job)` calls `EmbedService.batchEmbedRace(job.data.raceId)`, logs start/finish, errors propagate; `@OnWorkerEvent('failed')` logs the failed job id + error
- `EmbedModule` — import `QueueModule`, add `EmbedProcessor` to providers
- `embed.processor.spec.ts` — pipeline-runs-with-raceId, error propagation, failed-event logging
- Lint, test (148), build pass; `race-embed` worker registers at boot

### Summary

Consumer half of the background embedding pipeline (producer is step 39). `EmbedProcessor` is a BullMQ `WorkerHost` decorated `@Processor(EMBED_QUEUE)`; its `process(job: Job<EmbedJobData>)` runs `EmbedService.batchEmbedRace(raceId)` and lets errors propagate so BullMQ applies its retry/failure handling. Added an `@OnWorkerEvent('failed')` handler (opted in for observability) logging the failed job id + error stack via Nest `Logger` — the `failed` listener signature `(job: Job | undefined, error: Error, prev)` was verified against the bullmq types. `EmbedModule` imports `QueueModule` (so the worker binds to the registered `EMBED_QUEUE`) and registers `EmbedProcessor` as a provider; `forRoot` is NOT re-run (already global). Shared `EmbedJobData` type lives in `queue/` for the step-39 producer to reuse. `process` overrides the base `Promise<any>` with `Promise<void>` to stay `any`-free. Tests use the standalone-const harness: the processor is constructed directly (`new EmbedProcessor(mock)`) and `process`/`onFailed` called directly — the `worker` getter is never touched (it would build a real Redis-backed Worker). 3 new tests (148 total). The synchronous `batchEmbedRace` call in `IngestionService` is intentionally left in place until step 39. Boot check: worker registers with no Redis errors, app starts clean (Qdrant 401 was fixed post-step-37). 148/148 tests pass, build and lint clean.

---

## RootLayout (Step 44)

**Branch:** root-layout
**Completed:** 2026-06-15

### Goals

- `RootLayout` component: placeholder `<header>` → `ErrorBoundary` → `<Suspense fallback={<RouteFallback />}>` → `<Outlet />`
- `RootLayout.module.css` — flex column shell, header with `var(--color-border)` bottom border
- `router.tsx` rewired — parent route `{ element: <RootLayout /> }` with three page routes as children; `/` redirect stays top-level
- Per-route `<Suspense>` wrappers removed from `router.tsx`
- All four URLs still resolve correctly; build and lint pass

### Summary

Created `RootLayout` as a named `const` arrow component. Renders a placeholder `<header>` (text "ocr-intelligence" — replaced by Navbar in step 45), then wraps `<Outlet />` in `ErrorBoundary` → `Suspense`. Rewired `router.tsx` from a flat array to a layout-parent + children structure; the `/` redirect remains a top-level sibling to avoid rendering chrome around it. Centralising `Suspense` in `RootLayout` means the header stays visible while lazy pages load. `CursorProvider` omitted entirely — added in step 66.

---

## ErrorBoundary Component (Step 43)

**Branch:** error-boundary
**Completed:** 2026-06-15

### Goals

- `ErrorBoundary` class component with `getDerivedStateFromError` + `componentDidCatch`
- Render-prop `fallback?: (error: Error, reset: () => void) => ReactNode`
- Default fallback UI: error message + "Try again" button wired to `reset`
- Co-located `ErrorBoundary.module.css` using `var(--color-accent)` / `var(--color-border)`
- No existing files modified; lint + build pass

### Summary

Created `ErrorBoundary` as a React class component (required by React — only supported mechanism). `getDerivedStateFromError` normalises `unknown` caught values to `Error` via `instanceof` narrowing before storing in state. `componentDidCatch` logs with `console.error`. Arrow method `reset` reverts state to no-error. Render: children when healthy; `fallback(error, reset)` when provided; default CSS Module UI otherwise. Fixed a `verbatimModuleSyntax` tsconfig violation on first build — `ErrorInfo` and `ReactNode` required `import type`. No existing files changed.

---

## TanStack Query Client with Global Config and Devtools (Step 42)

**Branch:** tanstack-query-client
**Completed:** 2026-06-15

### Goals

- `@tanstack/react-query-devtools` installed as devDependency (v5)
- `src/lib/queryClient.ts` — module-scoped `QueryClient` with `STALE_TIME_MS: 60_000`, `MAX_RETRIES: 1`, `refetchOnWindowFocus: false`
- `App.tsx` wraps `<RouterProvider>` in `<QueryClientProvider>`; devtools lazy-imported, dev-only, excluded from prod bundle
- `apps/backend/src/common/constants.ts` created, consolidating `SECONDS_PER_MINUTE/HOUR`, `DEFAULT_PAGE/LIMIT/MAX_LIMIT`, `RACE_TYPES`, `RESULT_STATUSES` (previously duplicated across 8 files)

### Summary

Wired `QueryClientProvider` around `RouterProvider` in `App.tsx`. `QueryClient` lives at module scope in `src/lib/queryClient.ts` (avoids StrictMode remount discarding the cache). Devtools use `React.lazy()` + dynamic import gated by `import.meta.env.DEV` — Vite tree-shakes the chunk entirely in production builds (confirmed: no devtools chunk in `vite build` output). Also consolidated all duplicated backend constants into `apps/backend/src/common/constants.ts` — 8 consumer files updated with `.js`-extension imports (required by `"moduleResolution": "nodenext"`). The IDE repeatedly misresolved paths to `apps/constants` (a phantom location); the file was recreated at the correct path after the IDE moved and I deleted the stray copy.

---

## Per-Route Suspense Boundaries with Fallbacks (Step 41)

**Branch:** per-route-suspense-boundaries
**Completed:** 2026-06-15

### Goals

- Each lazy route (`/races`, `/races/:id`, `/ask`) wrapped in its own `<Suspense fallback={<RouteFallback />}>`
- Root `<Suspense fallback={null}>` removed from `App.tsx`
- `RouteFallback` component with CSS spinner (CSS Module, named export)
- `--color-accent` and `--color-border` CSS custom properties defined in `index.css` `:root`
- Build and lint pass

### Summary

Replaced the temporary root `<Suspense fallback={null}>` from step 40 with per-route boundaries in `router.tsx`, each wrapping its lazy element. Created `RouteFallback` as a named-export arrow component in `components/RouteFallback.tsx` with a `@keyframes spin` CSS Module spinner. Extracted the two hardcoded hex colors into `--color-accent` (`#6366f1`) and `--color-border` (`#e5e7eb`) on `:root` in `index.css`; the module references them via `var()`. The redirect route (`/`) is synchronous (`<Navigate>`) and intentionally left without a Suspense wrapper.

---

## React Router with Lazy Routes (Step 40)

**Branch:** react-router-lazy-routes
**Completed:** 2026-06-15

### Goals

- `pages/RacesPage.tsx`, `pages/RaceDetailPage.tsx`, `pages/AskPage.tsx` as default-export arrow components
- `RaceDetailPage` reads `:id` via `useParams` and displays it
- `router.tsx` defines 3 lazy routes with `createBrowserRouter`: `/` → redirect to `/races`, `/races`, `/races/:id`, `/ask`
- `App.tsx` renders `<Suspense fallback={null}><RouterProvider /></Suspense>` (fallback replaced in step 41)
- `pnpm --filter frontend build` and lint pass

### Summary

Wired React Router v7 into the frontend using `createBrowserRouter` + `RouterProvider`. Created three minimal placeholder pages as default-export arrow components. Each route lazy-loads its page via `React.lazy()`, with a temporary `<Suspense fallback={null}>` wrapping `<RouterProvider>` in `App.tsx` — step 41 will replace it with per-route fallbacks. Added a root `/` → `/races` redirect so navigating to the dev server root doesn't 404. ESLint's `react-refresh/only-export-components` suppressed at the top of `router.tsx` (legitimate — a router config file mixes lazy component variables with the non-component `router` export). Build produces three separate page chunks, confirming code splitting works.

---

## Navbar Component (Step 45)

**Branch:** navbar
**Completed:** 2026-06-15

### Goals

- `Navbar.tsx` — named `const` arrow component with brand text and two `NavLink`s
- `Navbar.module.css` — horizontal flex layout, active accent styling, responsive wrap at 480px
- Active link uses `var(--color-accent)` text color + bottom border
- `RootLayout.tsx` — placeholder `<header>` replaced with `<Navbar />`
- `RootLayout.module.css` — orphaned `.header` rule removed
- Lint passes; no `any` types

### Summary

Created `Navbar` component rendering "ocr-intelligence" brand span and two `NavLink`s ("Races" → `/races`, "Ask AI" → `/ask`). Active state composed via the `isActive` callback — base class always present, `.linkActive` appended when active (`var(--color-accent)` color + bottom border). Added `aria-label="Main"` on `<nav>`, `:focus-visible` accent outline on links, and vertical padding for adequate mobile tap targets. Media query at 480px wraps the brand to its own row and reduces gap. `RootLayout` updated to use `<Navbar />` in place of the placeholder header; orphaned `.header` CSS rule removed.

---

## PageWrapper Component (Step 46)

**Branch:** page-wrapper
**Completed:** 2026-06-15

### Goals

- `PageWrapper.tsx` — named `const` arrow component, named export, `children: ReactNode` only
- `PageWrapper.module.css` — single `.wrapper` class with `max-width: 1200px`, `margin-inline: auto`, `padding-inline: 24px`
- Max-width value local to the CSS Module; no new global tokens
- No existing files modified; `PageWrapper` not wired into any page yet
- Lint passes, no `any` types

### Summary

Created `PageWrapper` as a minimal layout wrapper: a `<div className={styles.wrapper}>` accepting `children: ReactNode`. The `.wrapper` class sets `max-width: 1200px`, `margin-inline: auto` for centring, and `padding-inline: 24px` for consistent horizontal breathing room. Max-width is kept local to `PageWrapper.module.css` with a comment — no new `:root` token added. No existing files touched. Wiring into page components is deferred to steps 53, 59, and the `/ask` page.

---

## Badge Component (Step 47)

**Branch:** badge
**Completed:** 2026-06-15

### Goals

- `Badge.tsx` — named exports `const Badge` and `interface BadgeProps { label: string; variant: string }`
- `Badge.module.css` — pill-shaped `.badge` base (neutral grey) + `[data-variant]` attribute-selector overrides for `Sprint`, `Super`, `DEKA`, `Open`
- Unknown/free-form variant values fall through to neutral base style automatically
- No existing files modified; no new global tokens

### Summary

Created `Badge` as a purely presentational `<span>` component. Color variants are resolved via `data-variant` attribute selectors in the CSS Module rather than one class per variant — this ensures free-form `AthleteDto.category` strings (e.g. "Elite", "Masters") degrade gracefully to the neutral style with zero extra code. Four named variants use accent-family colours with WCAG AA contrast pairs: Sprint → indigo, Super → violet, DEKA → sky, Open → emerald. `variant` prop is typed `string` (not a union) to accommodate open-ended category values. No existing files touched.

---

## SkeletonCard Component (Step 48)

**Branch:** skeleton-card
**Completed:** 2026-06-15

### Goals

- `SkeletonCard.tsx` — named `const` arrow component, named export, zero props
- `SkeletonCard.module.css` — `.card` shell, `.shimmer` with local `@keyframes`, `.title`/`.badge`/`.line` dimension classes
- Four shimmer blocks: title 60%×20px, badge 30%×16px, two lines 80%×14px; badge→line gap wider than line→line gap
- Shimmer gradient: `#e5e7eb → #f3f4f6 → #e5e7eb`, `background-position` animated left-to-right, infinite
- No hardcoded card width; no existing files modified; lint + build pass

### Summary

Created `SkeletonCard` as a zero-prop animated placeholder approximating `RaceCard`'s visual footprint. The `.shimmer` class carries the gradient (`#e5e7eb`/`#f3f4f6`) and `@keyframes shimmer` animation; four separate dimension classes (`.title`, `.badge`, `.line`) carry width/height and are composed with `.shimmer` via template literals. A `.divider` spacer creates the larger gap between the badge and detail lines. Card border uses `var(--color-border)`; shimmer fills are hardcoded greys (not tokens). No card width is hardcoded — the step-53 grid controls it. Also fixed a pre-existing `verbatimModuleSyntax` violation in `PageWrapper.tsx` (`ReactNode` → `type ReactNode`) discovered during the build check.

---

## SkeletonTable Component (Step 49)

**Branch:** skeleton-table
**Completed:** 2026-06-15

### Goals

- `SkeletonTable.tsx` — named export, one optional prop `rows?: number` (default `DEFAULT_ROWS = 5`)
- `SkeletonTable.module.css` — local shimmer + keyframes, `.table`, `.cell`, `.headerShimmer`/`.bodyShimmer`, five column-width classes
- Renders real `<table>` → `<thead>` (6 shimmer `<th>`s, 12px) → `<tbody>` (`rows` rows of 6 shimmer `<td>`s, 14px)
- Column order: position 24px, name 140px, category 64px, finish-time 72px, overall place 32px, category place 32px
- Row separators via `var(--color-border)`; no outer table border; no existing files modified

### Summary

Created `SkeletonTable` as a `<table>`-based loading placeholder for `AthleteLeaderboard`. A `COLUMNS` array of CSS Module class references drives both `<thead>` and `<tbody>` cell rendering — a single source of truth for column order and widths. Header shimmer blocks are 12px tall; body shimmer blocks are 14px. The shared `.colPlace` class covers both place columns (same 32px). Shimmer keyframes defined locally in `SkeletonTable.module.css` — not imported from `SkeletonCard`. Index-based keys used (static list). Lint passes with no changes to existing files.

---

## SkeletonChart Component (Step 50)

**Branch:** skeleton-chart
**Completed:** 2026-06-15

### Goals

- `SkeletonChart.tsx` — named export, one optional prop `bars?: number` (`DEFAULT_BARS = 8`)
- `SkeletonChart.module.css` — local shimmer + keyframes, `.root`, `.title`, `.chartArea`, `.leftCol`/`.rightCol`, `.label`, `.bar`, `.axis`
- Layout: title shimmer → two-column chart area (left: label shimmers, right: bar shimmers + x-axis strip)
- Both columns use `gap: 12px` and `14px` row height for horizontal row alignment
- No outer border/background; no fixed root height; no SVG/Recharts; no existing files modified

### Summary

Created `SkeletonChart` as a pure CSS/flexbox bar-chart loading placeholder for `ObstacleSplitChart` and `PenaltyRateChart` (steps 55–56). A `rows` array derived from `bars ?? DEFAULT_BARS` drives both columns. Left column uses `flex-shrink: 0` with fixed 80px label blocks; right column uses `flex: 1` so bars fill remaining width. The x-axis strip is rendered as a single element after the bar rows in `.rightCol`, outside the mapped array. Shimmer pattern identical to `SkeletonCard`/`SkeletonTable` — same gradient, timing, and radius, with local `@keyframes`. No existing files modified.

---

## RaceCard Component (Step 51)

**Branch:** race-card
**Completed:** 2026-06-15

### Goals

- `RaceCard.tsx` — named exports `const RaceCard` and `interface RaceCardProps { race: RaceDto }`
- `RaceCard.module.css` — card shell, name heading, detail list, `:hover` accent border + shadow
- Outermost element: `<Link to={`/races/${race.id}`}>` — whole card clickable, no underline
- Content: name → `<Badge raceType>` → detail row (formatted date · location · "X km" · "X obstacles")
- Date via module-level `Intl.DateTimeFormat`; no external library
- No data fetching; no existing files modified; lint + build pass

### Summary

Created `RaceCard` as a clickable `<Link>` wrapping a flex-column card shell. Detail items are an unstyled `<ul>` / `<li>` list rendered in a wrapping flex row for natural layout. Date formatted with a module-level `Intl.DateTimeFormat` instance (reused across renders). Hover state uses `color-mix(in srgb, var(--color-accent) 12%, transparent)` for a subtle accent ring alongside the border-color change — requires no hardcoded hex. `RaceDto` imported with `import { type RaceDto }` for `verbatimModuleSyntax` compliance. No existing files touched.

---

## RaceCardStats Component (Step 52)

**Branch:** race-card-stats
**Completed:** 2026-06-15

### Goals

- `src/api/http.ts` — named `http` Axios instance with `baseURL` from `VITE_API_URL`
- `src/api/races.ts` — named `getRace(id): Promise<RaceDetailDto>`
- `apps/frontend/.env` — `VITE_API_URL=http://localhost:3000` (gitignored, not committed)
- `RaceCardStats.tsx` — TanStack Query on mount; shimmer (pending) / null (error) / 3 stats (success)
- `RaceCard.tsx` — hover state via `useState` + conditional `<RaceCardStats>` render

### Summary

Introduced the frontend `api/` layer: a module-scoped Axios instance (`http.ts`) and a typed `getRace` function (`races.ts`). `RaceCardStats` uses `useQuery` with no `enabled` flag — it fires immediately on mount, which only happens when `RaceCard` is hovered (conditional mount via `useState`). Loading state shows three shimmer blocks (local `@keyframes`). Error state returns `null`. Success renders finisher count, avg finish time (MM:SS / H:MM:SS), and DNF rate as a horizontal stat row. Three private helpers (`formatTime`, `calcAvgTime`, `calcDnfRate`) handle derivation; named constants (`SECONDS_PER_HOUR`, `SECONDS_PER_MINUTE`, `PERCENT`) replace magic numbers. `RaceCard.tsx` updated with `onMouseEnter`/`onMouseLeave` and conditional render — only change to that file. `.env` is gitignored and was not committed.

---

## PenaltyRateChart Component (Step 56)

**Branch:** penalty-rate-chart
**Completed:** 2026-06-15

### Goals

- `PenaltyRateChart.tsx` — named exports `const PenaltyRateChart` and `interface PenaltyRateChartProps { results: RaceResultDto[] }`
- `computePenaltyRates()` — FINISHED results only; per obstacle: penalised ÷ total × 100; sorted by `obstacleNumber` ASC; zero-penalty obstacles included at `0%`
- Empty state: `<p>No penalty data available.</p>`
- Recharts horizontal `BarChart` (`layout="vertical"`), X-axis `domain={[0, 100]}`, ticks and tooltip as `"${value}%"`; red bars (`#ef4444` = `--color-danger`)

### Summary

Created `PenaltyRateChart` mirroring `ObstacleSplitChart`'s structure exactly. `computePenaltyRates` counts per obstacle how many FINISHED results had `penaltyCount > 0` vs total, returning raw `penaltyRate` (0–100) for Recharts axis scaling. `formatPercent` rounds to one decimal for display. Chart uses `domain={[0, 100]}` on X-axis so full range is always visible. Bar fill is `#ef4444` (`--color-danger`) — red to visually distinguish from the indigo time chart. Same dynamic height formula (`data.length * BAR_HEIGHT + 40`). Also in this branch: extracted all hardcoded CSS colors into tokens in `index.css` (9 new custom properties) and added the CSS token rule to `developer.md` and `start.md`. Lint and build pass with 0 errors.

---

## CategoryFilter Component (Step 57)

**Branch:** category-filter
**Completed:** 2026-06-15

### Goals

- `CategoryFilter.tsx` — named `const CategoryFilter` export with `CategoryFilterProps` (`categories: string[]`, `value: string | null`, `onChange: (value: string | null) => void`)
- Renders a native `<select>` with "All" option first, then one option per category in received order
- Controlled: `<select value>` driven by `value` prop; `null` maps to internal `''` sentinel
- Accessible label linked via `htmlFor`/`id` with visible "Category" text
- Handles empty `categories` without crashing
- `CategoryFilter.module.css` — `.wrapper`, `.label`, `.select` using CSS token vars; hover/focus accent states, `font-family: inherit`, `min-width: 160px`
- Added `--font-size-sm: 0.875rem` token to `index.css`
- Lints and builds clean

### Summary

Created `CategoryFilter` as a purely presentational controlled dropdown. Uses `ALL_SENTINEL = ''` internally (since `<select>` can't hold `null`) and maps to/from `null` at the prop boundary. Empty `categories` array renders only the "All" option — no crash. Fixed four UI reviewer findings: added `:hover` accent border, `font-family: inherit`, `min-width: 160px`, and defined `--font-size-sm` token in `index.css` (as required by the CSS token rule — use token or define it first). Follows `ObstacleSplitChart` / `PenaltyRateChart` idiom exactly: named export, `Props` interface, co-located CSS module. Category derivation and leaderboard filtering deferred to Steps 58–59.

---

## ObstacleSplitChart Component (Step 55)

**Branch:** obstacle-split-chart
**Completed:** 2026-06-15

### Goals

- `ObstacleSplitChart.tsx` — named exports `const ObstacleSplitChart` and `interface ObstacleSplitChartProps { results: RaceResultDto[] }`
- Derives average `splitTimeSeconds` per obstacle from FINISHED results; skips null splits; sorted by `obstacleNumber` ASC
- Empty state: `<p>No split data available.</p>`
- Recharts horizontal `BarChart` (`layout="vertical"`) in `ResponsiveContainer` — obstacle names on Y-axis, avg seconds on X-axis, custom `Tooltip` formatted as `MM:SS`
- `ObstacleSplitChart.module.css` — wrapper with "Avg Time per Obstacle" title

### Summary

Created `ObstacleSplitChart` as a pure presentational component. `computeAvgSplits` (module-level, not exported) filters to FINISHED results, iterates splits, groups by `obstacleNumber` in a `Map`, skips null `splitTimeSeconds`, then sorts ascending and returns `{ name, avgSeconds }[]`. `formatMmss` converts seconds to `M:SS`. Chart uses Recharts `layout="vertical"` for horizontal orientation; `YAxis type="category"` renders obstacle names (160px wide); `XAxis type="number"` ticks formatted as `MM:SS`; `Tooltip formatter` likewise. Chart height is dynamic (`data.length * BAR_HEIGHT + 40`) so all bars are visible without scrolling. Bar fill is `#6366f1` (Recharts `fill` prop doesn't resolve CSS custom properties). Lint and build pass with 0 errors.

---

## RaceHeader Component (Step 54)

**Branch:** race-header
**Completed:** 2026-06-15

### Goals

- `RaceHeader.tsx` — named exports `const RaceHeader` and `interface RaceHeaderProps { race: RaceDto }`
- Renders race `name` as `<h1>`, `<Badge>` for `raceType`, and a detail row: formatted date · location · distance km · obstacle count
- Module-level `Intl.DateTimeFormat` (same pattern as `RaceCard`)
- `RaceHeader.module.css` — flex-column layout, `var(--color-accent)` heading, CSS `·` separators via `::before`
- Pure presentational — no data fetching, no existing files modified

### Summary

Created `RaceHeader` as a pure presentational component. Renders a flex-column layout: `<h1>` with the race name in `var(--color-accent)`, a `<Badge>` row for `raceType`, and a `<ul>` detail list (date, location, distance km, obstacle count) with CSS `·` separators via `.detail + .detail::before`. Module-level `Intl.DateTimeFormat` matches `RaceCard` exactly. Props type is `RaceDto` — `RaceDetailDto` extends it so the step-59 page can pass either without a cast. Lint and build pass with 0 errors.

---

## /races Page (Step 53)

**Branch:** races-page
**Completed:** 2026-06-15

### Goals

- Add `getRaces(page?, limit?)` to `src/api/races.ts` returning `Promise<PaginatedResponse<RaceDto>>`
- Replace `RacesPage` stub with a `useQuery`-driven component
- Loading state: grid of 6 `<SkeletonCard />` instances (`SKELETON_COUNT = 6`)
- Error state: `<p>Failed to load races.</p>`
- Empty state: `<p>No races found.</p>`
- Success state: grid of `<RaceCard race={race} />` keyed by `race.id`
- All states wrapped in `<PageWrapper>` with a persistent `<h1>Races</h1>` heading
- Co-located `RacesPage.module.css` with `.grid` using `repeat(auto-fill, minmax(280px, 1fr))` and `gap: 24px`

### Summary

Added `getRaces(page = 1, limit = 20)` to `src/api/races.ts` calling `http.get('/races', { params: { page, limit } })` and returning `PaginatedResponse<RaceDto>`. Replaced the placeholder `RacesPage` stub with a `useQuery`-driven component: `isPending` renders a grid of 6 `SkeletonCard` instances, `isError` renders `<p>Failed to load races.</p>`, empty `data.data` renders `<p>No races found.</p>`, and success renders one `<RaceCard />` per item keyed by `race.id`. Skeleton and success grids share the same `.grid` CSS Module class to prevent layout shift. `SKELETON_COUNT = 6` named constant eliminates the magic number. Lint and build pass with 0 errors.

---

## Wire CSV Ingestion to Enqueue Embed Job (Step 39 — Phase 3 finale)

**Branch:** wire-ingestion-queue
**Completed:** 2026-06-14

### Goals

- `queue/queue.constants.ts` — add `EMBED_JOB = 'embed-race'`
- `IngestionService` — drop `EmbedService`; inject `@InjectQueue(EMBED_QUEUE) embedQueue: Queue<EmbedJobData>`; replace the synchronous `batchEmbedRace(raceId)` with `await this.embedQueue.add(EMBED_JOB, { raceId })` (after the transaction, outside the try/catch)
- `IngestionModule` — swap `EmbedModule` import for `QueueModule`
- `ingestion.service.spec.ts` — queue mock (captured `add` fn), success asserts `add(EMBED_JOB, { raceId })`, new no-enqueue-on-failure test
- Lint, test (149), build pass; verified end-to-end

### Summary

Moved embedding off the request path: `POST /ingest/csv` now saves the race in a transaction, then enqueues a BullMQ `EmbedJobData` job (`{ raceId }`) and returns immediately, instead of awaiting `EmbedService.batchEmbedRace` synchronously. The enqueue stays after the transaction and outside the DB try/catch — preserving the prior "error-after-successful-save propagates" semantics (a Redis-down enqueue failure is far rarer than the old synchronous-embed failure; mis-mapping it to a DB 500 would be wrong). `IngestionService` no longer depends on `EmbedService`, so `IngestionModule` swapped its `EmbedModule` import for `QueueModule` (which provides the injectable `Queue`); `EmbedModule` stays in the graph via `AppModule` (it hosts the `EmbedProcessor` consumer + `EmbedService`). Queue and job names are constants (`EMBED_QUEUE`/`EMBED_JOB`); `EmbedProcessor.process` handles all job names so `EMBED_JOB` is consumed fine. The spec's `add` mock is captured in a const to satisfy `unbound-method`; new test asserts no enqueue when the transaction fails. **Verified end-to-end with a real OpenAI key:** ingesting a fixture CSV returned `201 { raceId, rowsIngested: 19 }` immediately (async decoupling proven), the `EmbedProcessor` picked up the job, and called OpenAI — which returned **429 quota-exceeded** (an account billing limitation, not a code defect; auth succeeded — it was not a 401). The `onFailed` handler logged it correctly. The only unverified link is the final Qdrant upsert, blocked solely by the OpenAI account quota. 149/149 tests pass, build and lint clean. **Phase 3 (RAG pipeline, steps 26–39) is complete.**

---

## AthleteLeaderboard Component (Step 58)

**Branch:** athlete-leaderboard
**Completed:** 2026-06-16

### Goals

- `AthleteLeaderboard.tsx` — named exports `const AthleteLeaderboard` and `interface AthleteLeaderboardProps { results: RaceResultDto[]; categoryFilter: string | null }`
- `<table>` with 6 columns (Position, Name, Category, Finish Time, Overall, Category place) matching `SkeletonTable` widths exactly (24/140/64/72/32/32px)
- Filters rows by `categoryFilter` (exact match, `null` = all); sorts on a copy, never mutates `results`
- Sortable `<button>`-in-`<th>` headers (`aria-sort`, ▲/▼ indicator) with local `useState` sort state; default `overallPosition` ascending, null values always last
- Empty state: single `<td colSpan={6}>No results.</td>` row
- Lint and build pass with zero TypeScript errors

### Summary

Created `AthleteLeaderboard` following the `ObstacleSplitChart`/`PenaltyRateChart` idiom: named export, `Props` interface, co-located CSS Module, no data fetching. `COLUMNS` is a single array of `{ label, widthClass, sortKey? }` driving both header rendering and width classes — Position and Overall intentionally share the `overallPosition` sort key per spec (clicking either sorts the same value). `getDisplayRows` filters a copy of `results` then sorts via `compareResults`, which always pushes `null` sort values to the bottom regardless of direction. Reused `Badge` for category and the `SECONDS_PER_MINUTE`/`m:ss` formatting convention from `ObstacleSplitChart`. Two review-driven hardening changes from the `ui-reviewer`/`a11y` agents: fixed missing `<th>` padding on the non-sortable Category column (`:has(.sortBtn)` selector splits padding ownership), added a visible `:focus-visible` outline on sort buttons (previously `outline: none` with only a color change — failed WCAG 2.4.7), made the ▲/▼ glyph `aria-hidden` (redundant/inconsistent SR announcement), and added a visually-hidden `aria-live="polite"` paragraph announcing "Sorted by {column}, {direction}" on sort changes. Flagged but left as-is: `--color-text-muted`/`--color-accent` contrast ratios are borderline AA — these are pre-existing global tokens used elsewhere in the app, and the spec forbids adding new tokens. `pnpm --filter frontend lint`/`build` both pass with 0 errors.

---

## Race Detail Dashboard Page (Step 59)

**Branch:** race-detail-dashboard-page
**Completed:** 2026-06-16

### Goals

- Rewrite `RaceDetailPage.tsx` as a `useQuery`-driven page composing `RaceHeader`, `ObstacleSplitChart`, `PenaltyRateChart`, `CategoryFilter`, and `AthleteLeaderboard`
- Missing `id` → not-found state; `isPending` → skeleton placeholders; `isError` → visible failure message, no unhandled crash
- Derive distinct, non-empty `categories: string[]` from `race.results` via `useMemo`, computed unconditionally to preserve hook ordering
- Page-level `useState<string | null>` for selected category wired into `CategoryFilter` and `AthleteLeaderboard`
- New co-located `RaceDetailPage.module.css` — charts side-by-side on wide viewports, stacked on narrow
- `pnpm --filter frontend lint`/`build` pass; no backend/types/api files modified

### Summary

Replaced the step-40 placeholder with a full dashboard page following the `RacesPage.tsx` convention exactly: `useQuery` + `isPending`/`isError` branches inside a `renderBody()` helper, wrapped in `PageWrapper`. `categories` is memoized off `race?.results ?? []` via `[...new Set(...)].filter(Boolean)` — computed unconditionally before any early return so hook ordering stays stable across all four render branches (no-id, pending, error, success). Success branch passes `race.results` directly (unfiltered) to all three result-consuming children — filtering by category happens inside `AthleteLeaderboard` itself, not at the page level. New `.charts` CSS Module class uses `grid-template-columns: repeat(auto-fit, minmax(320px, 1fr))` for the responsive side-by-side/stacked layout. Reviewed two `code-scanner` findings as false positives after verifying against the actual type system: TanStack Query v5's discriminated `UseQueryResult` union means `race` narrows to non-undefined once `isPending`/`isError` are both false (confirmed by a clean `tsc -b`), and `AthleteDto.category` is already typed as a non-nullable `string` so `.filter(Boolean)` needs no extra type predicate. `pnpm --filter frontend lint`/`build` both pass with 0 errors; no backend, `@ocr/types`, or `api/` files touched.

---

## useSSE Hook (Step 60)

**Branch:** use-sse-hook
**Completed:** 2026-06-16

### Goals

- `apps/frontend/src/api/ask.ts` — `streamAsk(query, signal, callbacks)` POSTs `{ query }` to `/ask`, manually parses the `text/event-stream` response (native `EventSource` can't be used — the endpoint is POST), emits tokens/done/error via typed callbacks
- `apps/frontend/src/hooks/useSSE.ts` — `useSSE()` hook wrapping `streamAsk`, exposing `text`, `isStreaming`, `error`, `start`, `stop`
- Typed `UseSSEResult` return shape, no `any`
- `pnpm --filter frontend lint`/`build` pass

### Summary

First custom hook in the frontend. `streamAsk` reads `response.body` via `getReader()` + `TextDecoder`, buffers chunks, splits on `\n\n` frame separators, and parses each frame's `event:`/`data:` lines per the backend's fixed SSE wire format (`apps/backend/src/common/sse/sse-stream.ts`) — `data:` payloads are JSON-encoded strings requiring `JSON.parse`. `useSSE` holds an `AbortController` ref, resets state on `start`, aborts on `stop`/unmount, and appends tokens via a functional `setText` update. A `code-scanner` pass on the two new files surfaced one real critical bug (unvalidated `JSON.parse` cast to `string` on the `error` frame payload — now wrapped in a `parseStringPayload` helper with a `typeof` check and try/catch) and two real warnings (trailing buffer silently dropped when the stream closes without a final `\n\n`-terminated frame — now flushed after the read loop; a stale-callback race where a second rapid `start()` call's state updates could be clobbered by the first call's in-flight callbacks — now guarded by comparing the closure's controller against `controllerRef.current` before each `setState`). Declined the scanner's other suggestions (buffer size cap, SSE multi-line `data:` field accumulation, `id:`/`retry:` support) as over-engineering against a fixed, trusted, single-line backend wire format. `AskPage.tsx` and the chat UI components remain untouched (steps 61–65). `pnpm --filter frontend lint`/`build` and `pnpm --filter backend test` (150/150, unrelated) all pass.

---

## ChatInput Component (Step 61)

**Branch:** chat-input
**Completed:** 2026-06-16

### Goals

- `apps/frontend/src/components/ChatInput.tsx` — named export `ChatInput` + named `interface ChatInputProps` (`onSubmit: (query: string) => void`, `disabled?: boolean`, optional `placeholder?: string`); no default export
- Controlled text input wrapped in a `<form>` (Enter-to-submit works) with local `useState` for the draft text
- Submit handler trims the draft, blocks empty/whitespace-only submissions, calls `onSubmit(trimmed)`, and clears the input on success
- Submit button disabled when `disabled === true` OR draft is empty after trimming; input disabled when `disabled === true`
- `apps/frontend/src/components/ChatInput.module.css` — colors/font-sizes only via `var(--token)`
- `pnpm --filter frontend lint` passes; strict TypeScript, no `any`

### Summary

Created `ChatInput` as a standalone, controlled text-entry component for Phase 4's chat UI — first of steps 61–65, not wired into any page (`AskPage.tsx` wiring is step 65). Follows the `CategoryFilter.tsx` convention: named export, exported `Props` interface, co-located CSS Module, no default export. Local `useState<string>('')` holds the draft; submit handler trims, blocks whitespace-only submissions, calls `onSubmit(trimmed)`, and resets state. Button disabled when `disabled` prop is true or the trimmed draft is empty; input disabled when `disabled` is true. Added a visually-hidden `<label>` tied to the input via `id`/`htmlFor` for accessibility (beyond spec minimum). All existing tokens (`--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--font-size-sm`) sufficed — no new token needed. `maxLength={1000}` mirrors the backend's `@MaxLength(1000)` on `AskQueryDto`.

While committing this feature, also caught and fixed an unrelated pre-existing test gap: `csv-rows-parser.service.spec.ts`'s DEKA fixture test asserted "all penaltyCount === 0" against a fixture with no penalty data — a vacuous assertion that could never fail even if the penalty-parser broke. Added real penalty data (`Rowing;Sled Push`, `Rowing`, `Burpee Broad Jump`) to `DEKA_FIT_Novi_Sad_2024.csv` and replaced the test with two real assertions against specific split indices, mirroring the existing Subotica fixture test pattern. Also added a "No penalties recorded" empty-state note to `PenaltyRateChart` and a minor `RaceHeader` padding tweak — both committed separately as unrelated, low-risk changes. `pnpm --filter backend test` (27/27 in the affected suite) and `pnpm --filter frontend lint` both pass.

---

## ChatMessage Component (Step 62)

**Branch:** chat-message
**Completed:** 2026-06-16

### Goals

- `apps/frontend/src/components/ChatMessage.tsx` — named export `ChatMessage` + named `interface ChatMessageProps` (`role: 'user' | 'assistant'`, `content: string`, `isStreaming?: boolean`); no default export
- Renders `content` with preserved line breaks
- Bubble visually distinguishable by `role` (background + alignment)
- Visible in-progress indicator when `isStreaming === true`; absent when falsy; still renders correctly when `content === ''` and streaming
- `apps/frontend/src/components/ChatMessage.module.css` — colors/font-sizes only via `var(--token)`
- `pnpm --filter frontend lint`/`build` pass; strict TypeScript, no `any`

### Summary

Created `ChatMessage` as a purely presentational chat bubble — second of Phase 4's chat UI components (steps 61–65), not yet wired into any page. User messages align right with `var(--color-accent)` background + `var(--color-surface)` text; assistant messages align left with a new `--color-bubble-assistant-bg` (#f3f4f6) token + `var(--color-text)`. A blinking `▍` cursor (`aria-hidden`, CSS `@keyframes blink`) renders after the content when `isStreaming` is true. Two review-driven fixes applied after `ui-reviewer`/`a11y` agent passes: (1) `.bubble` is a flex child of `.row` (display: flex) — added `min-width: 0` + `overflow-wrap: anywhere` (the original `word-wrap: break-word` alone wouldn't reliably break long unbroken strings inside a non-shrinking flex item) and an explicit `line-height: 1.4` plus `min-height: 1.4em` so an empty/streaming-only bubble doesn't collapse to zero height; (2) wrapped the cursor's blink animation in `@media (prefers-reduced-motion: reduce) { animation: none }`. Flagged but correctly deferred to step 64/65 (where the component is composed and wired to live data): `aria-busy`/live-region announcement of streaming state for screen reader users, since `ChatMessage` itself has no page to be wired into yet. `pnpm --filter frontend lint`/`build` pass; `pnpm --filter backend test` (150/150, unrelated) unaffected.

---

## SourceCitations Component (Step 63)

**Branch:** source-citations
**Completed:** 2026-06-16

### Goals

- `apps/frontend/src/components/SourceCitations.tsx` — named `const SourceCitations`, no default export; named exported `Citation { id; text; label?; score? }` and `SourceCitationsProps { citations: Citation[] }`
- Empty `citations` → renders `null`; non-empty → collapsed-by-default expandable panel ("Sources (N)")
- Expanded content lists every citation (`label` if present, `text`, `score` to fixed decimals if present)
- Keyboard-operable, correct expanded/collapsed semantics for assistive tech
- `apps/frontend/src/components/SourceCitations.module.css` — colors/font-sizes only via `var(--token)`
- `pnpm --filter frontend lint` passes; strict TypeScript, no `any`

### Summary

Created `SourceCitations` as a pure props-driven expandable panel — third of Phase 4's chat UI components (steps 61–65), not yet wired into any page or data source. Native `<details>/<summary>` used for the toggle (free keyboard/AT disclosure semantics, no manual `aria-expanded` needed). Citation list rendered as `<ul>/<li>`, each showing optional bold `label`, required `text`, and optional `score` formatted via a named `SCORE_DECIMALS = 2` constant as "Relevance: X.XX". Two review-driven fixes applied after `ui-reviewer`/`a11y` agent passes: (1) `.summary`'s text color changed from `--color-text-muted` to `--color-text` — the muted token gave the primary clickable trigger weak contrast/affordance — and `overflow-wrap: anywhere` added to `.label` (previously only `.text` was protected against long unbroken strings); (2) each `<li>` gained `aria-label={citation.label ?? citation.text}` since plain `<li>`s with no accessible name were indistinguishable to screen reader users navigating the list. Declined as over-engineering: restructuring `<p>` tags into `<dl>/<dt>/<dd>` (visual `.item` grouping already conveys the relationship; not a WCAG failure). **Known gap, explicitly flagged in the spec and carried forward:** the backend's `/ask` SSE stream only transmits text tokens — `RetrieveService.retrieve()` computes chunks server-side but never sends them to the frontend, so this component has no real data source yet; wiring an actual citations channel (SSE event or REST call) is unplanned and left as an open question for a future step before steps 64/65 can render live citations. `pnpm --filter frontend lint`/`build` pass; `Citation` deliberately kept as a frontend-local type, not added to `@ocr/types`, to avoid drift against an undefined wire format.

---

## ChatHistory Component (Step 64)

**Branch:** chat-history
**Completed:** 2026-06-17

### Goals

- `ChatHistory.tsx` — named `const ChatHistory`, named exported `ChatHistoryMessage` and `ChatHistoryProps` interfaces
- `ChatHistoryMessage`: `{ id: string; role: 'user' | 'assistant'; content: string; isStreaming?: boolean; citations?: Citation[] }`
- Scrollable container (`overflow-y: auto`) wrapping the message list
- Each message renders one `<ChatMessage>` keyed by `message.id`; non-empty `citations` renders a sibling `<SourceCitations>`
- Per-message wrapper div keyed by `message.id` to satisfy the sibling requirement
- Auto-scroll to bottom via `useRef` + `useEffect` keyed on `messages.length`
- Empty `messages` array renders empty container, no crash
- `ChatHistory.module.css` — scroll container and entry styles using spacing values only; no hardcoded colors or font-sizes
- `pnpm --filter frontend lint` passes; no `any` types; TypeScript build clean

### Summary

Created `ChatHistory` as the fourth of Phase 4's chat UI components (steps 61–65), not yet wired into any page. The component renders a `.scroll` div (`overflow-y: auto; height: 100%`) mapping each `ChatHistoryMessage` to a `.entry` wrapper keyed by `message.id`. Each entry contains one `<ChatMessage>` (passing `role`, `content`, `isStreaming`) and, when `citations` is non-empty, a sibling `<SourceCitations>` — the `.entry` wrapper satisfies the spec requirement that `SourceCitations` be a sibling of, not nested inside, `ChatMessage`. A sentinel `<div ref={bottomRef} />` at the end of the list receives `scrollIntoView({ block: 'end' })` from a `useEffect` keyed on `messages.length` — fires only when a new message is added, not on every streamed token. CSS Module uses only `gap` and `flex` — no hardcoded colors or font-sizes. Lint and TypeScript build both pass with 0 errors; no existing files modified.

---

## /ask Page (Step 65)

**Branch:** ask-page
**Completed:** 2026-06-17

### Goals

- Rewrite `AskPage.tsx` placeholder into a full chat page owning message history
- `messages: ChatHistoryMessage[]` state, initialised to `[]`
- Submit appends a `user` message + blank `assistant` placeholder (`isStreaming: true`), then calls `useSSE.start(query)`
- `useEffect([text])` syncs accumulated stream text to the current assistant message
- `useEffect([isStreaming])` finalises the assistant message on done/error (guarded by ref)
- Stream error surfaced via `role="alert"` element styled `var(--color-danger)`, clears on next submit
- `ChatInput` receives `disabled={isStreaming}`
- Full-height flex layout: `.page { flex: 1 }` fills below navbar; `.history { flex: 1; min-height: 0 }` lets `ChatHistory` scroll internally
- New `AskPage.module.css`; no `PageWrapper`; no `calc(100vh - X)`
- `pnpm --filter frontend lint` and `build` pass; zero `any`

### Summary

Replaced the `AskPage` stub with a fully wired chat page. Message history is owned entirely by the page as `useState<ChatHistoryMessage[]>([])` — `useSSE` is responsible only for the live in-flight stream (`text`, `isStreaming`, `error`). `handleSubmit` appends both the user message and an assistant placeholder atomically before calling `start(query)`, so the UI shows the empty streaming bubble immediately. `currentAssistantIdRef` pins which assistant message is "current" across effects: the `[text]` effect maps only that id, and the `[isStreaming]` effect clears the ref and sets `isStreaming: false` when the stream ends — guarded so it does not fire spuriously on mount (`isStreaming` starts `false`). Errors surface below `ChatInput` as a `role="alert"` paragraph; they clear on the next submission because `useSSE.start()` resets `error` to `null`. Layout: `.page { flex: 1; display: flex; flex-direction: column; min-height: 0 }` makes the page a direct flex child of `RootLayout`'s flex-column wrapper, filling all remaining viewport height without any `calc()`; `.history { flex: 1; min-height: 0 }` gives `ChatHistory`'s existing `height: 100%; overflow-y: auto` scroll container the space it needs. `export default AskPage` preserved for the lazy route. Vite emits a separate `AskPage` chunk (5.06 kB gzip: 2.08 kB). Lint and TypeScript build pass with 0 errors; no existing files modified.

---

## DropZone Component (Step 66)

**Branch:** drop-zone
**Completed:** 2026-06-17

### Goals

- New `DropZone.tsx` — named exports `DropZoneProps` + `DropZone`, no default export, no `any`
- `DropZoneProps { onFile: (file: File) => void; disabled?: boolean }`
- New `DropZone.module.css` — all styling via `var(--token)`, no inline styles
- Idle: dashed `var(--color-border)` border, muted prompt text
- Drag-over: `var(--color-accent)` border + 8% tint via `color-mix`; clears on leave/drop
- Click-to-browse via hidden `<input type="file" accept=".csv">` triggered by `useRef`
- Keyboard: `tabIndex={0}`, Enter/Space open picker (Space prevents scroll); no-op when disabled
- File validation: `.csv` extension or `text/csv` MIME; `onFile` only on valid; inline error on invalid
- Multi-file: only `files[0]`; `e.target.value = ''` reset for re-selection of same file
- Error clears on drag-enter and on picker open
- Disabled: opacity + `cursor: not-allowed`, `tabIndex={-1}`, `aria-disabled`, all interactions blocked
- A11y: `role="button"`, `aria-label="Upload a CSV file"`, visually-hidden `<label>` for the input
- `pnpm --filter frontend lint` and `build` pass

### Summary

Created `DropZone` as a purely presentational file-picker component — no Axios, no upload state, no backend knowledge. Internal state is limited to `dragOver: boolean` and `error: string | null`. A `validateAndEmit(file)` helper centralises the validation logic (`.csv` extension as primary gate, `text/csv` MIME as fallback, since some browsers report inconsistent MIME types for CSV). `onDragOver` calls `preventDefault()` (required to enable `drop`); `onDragEnter` toggles drag-over state and clears any error; `onDragLeave` resets it; `onDrop` reads `dataTransfer.files[0]` and validates. Click-to-browse triggers the hidden `<input>` via `inputRef.current?.click()`; `e.target.value` is reset after each `onChange` so re-selecting the same file fires the event again. Keyboard handler responds to Enter and Space (Space calls `preventDefault` to avoid page scroll). Disabled prop blocks all interaction paths (click, keyboard, drop) and sets `aria-disabled` + `tabIndex={-1}`. CSS Module uses `color-mix(in srgb, var(--color-accent) 8%, transparent)` for the drag-over tint — no hardcoded hex values. Lint and TypeScript build pass with 0 errors; no existing files modified.

---

## /upload Page (Step 67)

**Branch:** upload-page
**Completed:** 2026-06-17

### Goals

- NEW `apps/frontend/src/api/ingest.ts` — `uploadCsv(file, onProgress?)` wraps `POST /ingest/csv` with `FormData { file }`, streams integer percent via `onUploadProgress`, returns `{ raceId, rowsIngested }`, no try/catch
- NEW `apps/frontend/src/pages/UploadPage.tsx` — `idle → uploading → error` state machine, DropZone disabled while uploading, redirects to `/races/:raceId` on success
- Progress bar with `role="progressbar"`, `aria-valuenow/min/max`, fill width via `--pct` CSS custom property, numeric percent label
- Error message with `role="alert"`, `var(--color-danger)`, NestJS `message` string or `string[]` handled
- Error extraction helper: `axios.isAxiosError` narrowing, joins array messages, fallback string
- NEW `apps/frontend/src/pages/UploadPage.module.css` — tokens only, `--pct` drives fill width
- EDIT `apps/frontend/src/router.tsx` — lazy `/upload` route added as child of `RootLayout`
- `pnpm --filter frontend lint` and `build` pass; zero `any`

### Summary

Built the `/upload` page completing Phase 4's CSV ingestion flow on the frontend. `api/ingest.ts` is a new dedicated API layer file (not added to `races.ts`) — `uploadCsv` builds a `FormData` with field name `"file"` (matching the backend `FileInterceptor`), attaches `onUploadProgress` to compute and emit integer percent (guarded by `event.total` for environments that omit it), and returns `res.data` with errors propagating unwrapped to the caller. `UploadPage` owns a three-field state machine: `status` (`'idle' | 'uploading' | 'error'`), `progress`, and `errorMsg`. On `onFile` from `DropZone`, it resets all fields, sets `'uploading'`, calls `uploadCsv(file, setProgress)`, and on resolve navigates immediately to `/races/:raceId` (no intermediate success screen, `rowsIngested` not displayed). On reject, `extractErrorMessage` narrows with `axios.isAxiosError`, handles both `string` and `string[]` shapes from NestJS (class-validator returns arrays), and falls back gracefully. The progress bar uses `role="progressbar"` with full `aria-value*` attributes; its fill div uses a `--pct` CSS custom property set via `style` (the sole permitted dynamic-value exception — all other values use tokens). `UploadPage.module.css` uses `var(--color-accent)` for the fill, `var(--color-danger)` for errors, `var(--color-text-muted)` for the percent label. `router.tsx` gains a fourth lazy child route at `/upload` under `RootLayout`. Vite emits a separate `UploadPage` chunk (2.91 kB gzip: 1.33 kB). Lint and TypeScript build pass with 0 errors.

---
## DELETE /races/:id Endpoint

**Branch:** delete-races-endpoint
**Completed:** 2026-06-17

### Goals

- NEW `VectorStoreService.deleteByRaceId(raceId)` — calls `client.delete` with `must` filter on `raceId`, debug log, errors propagate
- EXTEND `RacesService` constructor with `DataSource`, `RaceResult`/`ObstacleSplit` repos, `VectorStoreService`, `Logger`
- NEW `RacesService.remove(id)` — 404 pre-check, `dataSource.transaction` cascade delete (ObstacleSplit → RaceResult → Race), best-effort Qdrant cleanup after commit
- `@Delete(':id')` on `RacesController` with `@HttpCode(HttpStatus.NO_CONTENT)`, `ParseUUIDPipe`, full Swagger decorators
- `VectorStoreModule` added to `RacesModule` imports
- 3 new `deleteByRaceId` tests, 4 new `remove` tests, new `races.controller.spec.ts` with 2 DELETE tests
- 162 tests pass, lint pass, build pass

### Summary

Added `DELETE /races/:id` as a 204 No Content endpoint. `RacesService.remove` performs a 404 guard using `findOne`, then runs a `DataSource.transaction` that deletes in FK order: ObstacleSplit rows (only if results exist, guarding `IN ()` on empty array), then RaceResult rows, then the Race row. After the transaction commits, Qdrant vectors are cleaned up best-effort — any Qdrant failure is caught, logged at `error` level, and swallowed so that 204 is always returned when the DB delete succeeded. `deleteByRaceId` itself has no try/catch — the wrapping lives in `RacesService`. Three test suites updated: `vector-store.service.spec.ts` gained 3 `deleteByRaceId` tests verifying filter shape, error propagation, and debug log; `races.service.spec.ts` extended the constructor call (4 new injections) and added 4 `remove` tests (happy path, 404, Qdrant-failure-still-resolves, empty-results-skips-split-delete); new `races.controller.spec.ts` verifies that `remove` delegates and propagates `NotFoundException`. Total: 162 tests pass.

---

## Delete Button on RaceCard

**Branch:** delete-racecard-button
**Completed:** 2026-06-17

### Goals

- NEW `deleteRace(id: string): Promise<void>` in `api/races.ts` — `http.delete`, resolves `void`
- Delete button on `RaceCard` rendered only while hovered, inside the `<Link>` wrapper
- Click: `stopPropagation` + `preventDefault` first, then `window.confirm` naming the race
- On confirm: `useMutation` → `deleteRace`; on success: `queryClient.setQueryData` filters race from `data` and decrements `total`
- Pending: button disabled + `aria-busy`; Error: inline `Failed to delete race.` message in card
- `.deleteButton` / `.deleteError` CSS classes using `--color-danger` token
- Upload link added to Navbar
- Font-size scale consolidated from 7 literals → 4 tokens (`--font-size-xl/base/sm/xs`) across all CSS module files

### Summary

Extended `RaceCard` with a hover-gated delete button that guards navigation with `e.preventDefault()` + `e.stopPropagation()` before the `window.confirm` dialog. Cache update via `setQueryData` removes the card immediately on success without a refetch; the updater guards the `undefined` case. `deleteRace` resolves `void` (no body parsing on 204). Also added the Upload nav link to `Navbar` and consolidated all hardcoded `font-size` literals across 8 CSS module files into 4 root tokens (`--font-size-xl: 2rem`, `--font-size-base: 1rem`, `--font-size-sm: 0.875rem`, `--font-size-xs: 0.75rem`). Lint and build pass.

---

## CursorProvider Context

**Branch:** cursor-provider
**Completed:** 2026-06-17

### Goals

- NEW `apps/frontend/src/context/CursorContext.tsx` — exports `CursorMode`, `CursorContextValue`, `CursorContext`, `CursorProvider`
- `type CursorMode = 'default' | 'hover' | 'pointer'`; `'hover'` reserved for downstream steps
- `interface CursorContextValue { x: number; y: number; hint: string | null; mode: CursorMode }` — read-only, no setters
- Single `mousemove` listener on `window`; derived state via `Element.closest()` for hint and mode
- `CursorProvider` mounted in `RootLayout.tsx` wrapping `<Navbar />` + `<ErrorBoundary>`
- Lint and build pass

### Summary

Created `CursorContext.tsx` with a read-only context exposing `x`, `y`, `hint`, and `mode` derived on every `mousemove`. The `mousemove` handler (stabilised with `useCallback`) narrows `event.target` to `Element`, then uses `closest()` once for `data-cursor-hint` attribute lookup and once for interactive-element detection — no manual DOM walk. All four fields are set in a single `setState` call per move. Module-level constants (`INTERACTIVE_SELECTOR`, `CURSOR_HINT_ATTR`) eliminate inline strings. Added `/* eslint-disable react-refresh/only-export-components */` following the same pattern as `router.tsx` since the file exports both a context object and a component. Mounted `CursorProvider` in `RootLayout` as the single correct wrap point (object-based routing prevents wrapping from `App.tsx`).

---

## useCursor Hook

**Branch:** use-cursor-hook
**Completed:** 2026-06-17

### Goals

- NEW `apps/frontend/src/hooks/useCursor.ts` — `export const useCursor = (): CursorContextValue => useContext(CursorContext)`
- Pure wrapper; returns context value unchanged; no re-exports of context symbols
- Lint and build pass

### Summary

Four-line hook file. `useCursor` wraps `useContext(CursorContext)` with an explicit return type annotation so consumers get a typed `{ x, y, hint, mode }` without importing `useContext` or `CursorContext` directly. No "throw outside provider" guard — the context has a concrete default value so `useContext` can never return `undefined`. Steps 72 and 73 will consume this hook.

---

## CursorDot Component

**Branch:** cursor-dot
**Completed:** 2026-06-17

### Goals

- NEW `CursorDot.tsx` — Framer Motion `motion.div`, no props, reads `{ x, y, mode }` from `useCursor()`
- Position via `style={{ left: x, top: y }}` — no lag; shape via `animate={SHAPES[mode]}` — smooth transition
- `SHAPES` record: `default/hover` → 10px filled circle (`--color-accent`); `pointer` → 20px ring (2px border, transparent bg)
- Named constants for all dimensions: `DOT_SIZE`, `RING_SIZE`, `RING_BORDER`, `TRANSITION_DURATION`, `FULL_RADIUS`
- NEW `CursorDot.module.css` — `position: fixed`, `pointer-events: none`, `border-style: solid`, `z-index: 9999`
- EDIT `index.css` — `cursor: none` on `body`
- EDIT `RootLayout.tsx` — `<CursorDot />` first child inside `<CursorProvider>`
- Lint and build pass

### Summary

`CursorDot` renders a Framer Motion `motion.div` fixed to the viewport. Position is set directly via inline `style={{ left, top }}` so the dot stays perfectly glued to the cursor with zero lag. Shape transitions (width, height, border-radius, background, border) are driven by a typed `Record<CursorMode, ShapeTarget>` lookup passed to Framer Motion's `animate` prop with `duration: 0.15, ease: 'easeOut'`. All dimension literals are named constants. `border-style: solid` in the CSS Module ensures the ring border renders when `borderWidth` animates above 0. `cursor: none` added globally to `body` in `index.css`; `<CursorDot />` mounted as the first child inside `<CursorProvider>` in `RootLayout`.

---

## Magnifier Mode (Step 74)

**Branch:** magnifier-mode
**Completed:** 2026-06-17

### Goals

- `CursorMagnifier` component renders a 200×200 `<canvas>` near the cursor showing a 2× zoomed crop of the page
- Activated when cursor is over any element marked `data-cursor-magnifier="true"`
- `CursorContext` sets `mode = 'hover'` (the previously unused mode) when over a magnifier element
- One-time `html2canvas-pro` snapshot taken on hover-in; crop redrawn on each `{x,y}` change without recapturing
- `RootLayout` mounts `<CursorMagnifier />` alongside `<CursorDot />` and `<CursorHint />`
- `pnpm --filter frontend lint` passes, no TypeScript `any`

### Summary

Installed `html2canvas-pro` as a frontend dependency. Updated `CursorContext.tsx` to implement 3-tier mode priority: `[data-cursor-magnifier]` → `'hover'`, interactive (`a/button/[role=button]/[tabindex]`) → `'pointer'`, else `'default'` — finally activating the reserved `'hover'` mode. Created `CursorMagnifier.tsx`: on transition into `'hover'`, calls `html2canvas(document.body, { scale: 1, useCORS: true })` once; result stored in a ref with a `cancelled` guard against race conditions where mode leaves `'hover'` before the promise resolves. On each `{x, y}` change while hovering, crops a 100×100 region (with scroll-offset correction and clamped bounds) and draws it into the 200×200 canvas at 2× zoom. Canvas positioned 20px right and 20px above the cursor via inline `style`, styled `z-index: 9997` with `var(--color-border)` border and `pointer-events: none` in the CSS Module. Mounted `<CursorMagnifier />` in `RootLayout` inside `<CursorProvider>`. Lint passes clean, no `any`.

---

## Project README (Step 76)

**Branch:** project-readme
**Completed:** 2026-06-17

### Goals

- New `README.md` at repo root — title + one-paragraph overview of the project
- Tech-stack table with accurate versions (React 19, NestJS, Postgres 16, Qdrant v1.13.6, Redis 7 + BullMQ, OpenAI, pnpm 10.33.0 + Turborepo)
- Mermaid architecture diagram covering ingestion flow and RAG query flow, with all three Docker services and frontend pages
- Repository layout subsection (`apps/frontend`, `apps/backend`, `packages/types`)
- Prerequisites list and numbered local setup instructions (clone → two env files → install → docker → start)
- Service URLs table and environment-variables table for both `.env` files
- Loading data section: `/upload` UI + `curl POST /ingest/csv` using a fixture CSV
- Example RAG queries: 3 natural-language questions + `curl POST /ask` with SSE note
- 3 demo screenshot embeds from `docs/` folder

### Summary

Created the first user-facing `README.md` at the repo root. Documentation-only — no source files were modified. Key decisions: Node.js ≥ 20.11 stated as prerequisite (Vite 8's binding constraint; no `.nvmrc` or `engines` field exists). The Mermaid diagram uses a `flowchart TB` layout with three subgraphs (Docker Compose, Frontend, Backend) and a standalone OpenAI node, covering both the ingestion pipeline and the RAG query flow. The env-var table is split into two sections (root `.env` for Docker Compose, `apps/backend/.env` for NestJS) with an explicit callout that root `.env.example` is missing the backend-only vars (`DB_HOST`, `DB_PORT`, `QDRANT_URL`, `OPENAI_API_KEY`, `CORS_ORIGIN`) — readers are instructed to create `apps/backend/.env` manually. Qdrant documented as loopback-bound (`127.0.0.1:6333`). Three 1×1 placeholder PNGs committed at `docs/screenshot-races.png`, `docs/screenshot-race-detail.png`, `docs/screenshot-ask.png` so screenshot links resolve; the README notes they should be replaced with live captures. No LICENSE file exists in the repo; license section omitted.

---

## Framer Motion Parallax Hero Section (Step 75)

**Branch:** framer-motion-parallax-hero
**Completed:** 2026-06-17

### Goals

- New `RacesHero` component (named export, `const` arrow function) with its own CSS Module
- Scroll-driven parallax: at least two layers (background + foreground heading) moving at different speeds via `useScroll` + `useTransform`
- `useScroll` targets the hero's own ref with named `offset` constants; all numeric values extracted as named constants
- `RacesHero` absorbs the `<h1>Races</h1>` from `RacesPage` — exactly one h1 on the page at all times
- `RacesPage.tsx` renders `<RacesHero />` first inside `<PageWrapper>`, before `renderBody()`
- `useReducedMotion()` disables all transforms when OS prefers reduced motion
- Existing loading / error / empty / grid states below the hero are unchanged
- Lint and build pass with no TypeScript errors; no `any` types

### Summary

Created `RacesHero` as a new named-export component with two scroll-driven parallax layers. A `useRef<HTMLElement>` on the section is passed as `target` to `useScroll({ offset: ['start start', 'end start'] })`, mapping `scrollYProgress` 0→1 as the hero scrolls off screen. Background layer uses `useTransform(scrollYProgress, [0, 1], [0, 80])` — slides down 80px slower than scroll, simulating depth. Foreground heading uses `[0, -40]` — leads upward for a floating effect. `useReducedMotion()` clamps both to 0 when OS prefers reduced motion. Background element extends `−90px` beyond the top and bottom edges of the hero container (absolute, not percentage) to absorb the 80px travel without exposing gaps through the `overflow: hidden` rounded border. Four new design tokens added: `--color-hero-bg`, `--color-hero-glow`, `--color-hero-text`, `--font-size-hero`. The existing `<h1>Races</h1>` in `RacesPage.tsx` was removed and absorbed into the hero. The `renderBody()` grid/skeleton/error states are unchanged below the hero.

---

## CursorHint Tooltip System

**Branch:** cursor-hint
**Completed:** 2026-06-17

### Goals

- NEW `CursorHint.tsx` — reads `{ x, y, hint }` from `useCursor()`; `AnimatePresence` + `motion.div` shown only when `hint !== null`
- Position via `style={{ left: x + 16, top: y + 8 }}`; fade + `y: 4→0` enter/exit, `duration: 0.15`
- Named constants: `HINT_OFFSET_X = 16`, `HINT_OFFSET_Y = 8`, `HINT_TRANSITION_DURATION = 0.15`
- NEW `CursorHint.module.css` — `position: fixed`, surface bg, border, `border-radius: 4px`, `--font-size-xs`, `pointer-events: none`, `z-index: 9998`
- EDIT `RootLayout.tsx` — `<CursorHint />` after `<CursorDot />`
- Lint and build pass

### Summary

`CursorHint` consumes the `hint: string | null` already derived by `CursorProvider` from `data-cursor-hint` attribute lookups — no context changes needed. `AnimatePresence` directly wraps the conditional `motion.div` so exit animations fire correctly when `hint` transitions to null. Position tracked via `style` (not animated) at a fixed pixel offset from the cursor, matching the lag-free pattern of `CursorDot`. The tooltip pill floats at `z-index: 9998`, one layer below `CursorDot`'s 9999.

---

## Project README with Architecture Diagram (Step 76)

**Branch:** project-readme
**Completed:** 2026-06-17

### Goals

- `README.md` at repo root: title, tech-stack table, Mermaid architecture diagram, repo layout, prerequisites, 7-step local setup, service URLs, env-var reference tables for both `.env` files, loading-data curl example, 3 RAG query examples, 3 screenshot embeds
- Diagram covers both the ingestion flow (CSV → Postgres → BullMQ → OpenAI → Qdrant) and the RAG query flow (Client → POST /ask → SSE stream)
- Placeholder PNG screenshots committed under `docs/` so the embeds resolve
- Lint and build pass

### Summary

Created a 300-line `README.md` with a `flowchart TB` Mermaid diagram (single-line node labels for GitHub compatibility). Placeholder 1×1 PNGs generated via Node.js for `docs/screenshot-races.png`, `docs/screenshot-race-detail.png`, and `docs/screenshot-ask.png`. The diagram covers two sub-flows: ingestion (Upload CSV → `POST /ingest/csv` → Postgres → BullMQ → OpenAI → Qdrant) and RAG query (`POST /ask` → Retrieve → Prompt → OpenAI → SSE). Env-var tables cover both the root `.env` (Docker Compose) and `apps/backend/.env` (NestJS runtime).

---

## Empty State Components (Step 79)

**Branch:** step-79-empty-state-components
**Completed:** 2026-06-17

### Goals

- New `EmptyState` component with `title`, `description?`, `icon?`, `action?` props; CSS Module using only `var(--token)` for colors and font-sizes
- `RacesPage` empty branch replaced with `<EmptyState title="No races found" description="Upload a CSV to get started." />`
- `AskPage` shows empty prompt when `messages.length === 0 && !isStreaming`
- `AthleteLeaderboard` "No results." text replaced with `<EmptyState title="No results" />` inside the existing `<td colSpan>`
- Lint and build pass

### Summary

Created `EmptyState` as a named-export `const` arrow component with four optional props (`title` required, `description`, `icon`, `action`). All optional props render conditionally with no empty wrapper when absent. CSS Module references `var(--color-text)`, `var(--color-text-muted)`, `var(--font-size-base)`, `var(--font-size-sm)` — no hardcoded values. Applied in three places: `RacesPage` (list empty state), `AskPage` (initial chat prompt, guarded with `!isStreaming` so it vanishes immediately on first submit), `AthleteLeaderboard` (inside existing `<td colSpan={COLUMNS.length}>` to preserve valid table markup). Error and loading states left untouched.

---

## API Client Audit — shared API_URL constant, VITE_API_URL types, frontend .env.example (Step 78)

**Branch:** step-78-api-client-audit
**Completed:** 2026-06-17

### Goals

- `http.ts` exports named constant `API_URL: string`; axios instance's `baseURL` references it; default URL literal in exactly one place
- `ask.ts` imports `API_URL` from `./http`; local duplicate removed; SSE `fetch` logic unchanged
- `src/vite-env.d.ts` (new) declares `ImportMetaEnv` with `readonly VITE_API_URL: string` — narrows type from `string | undefined` to `string`
- `apps/frontend/.env.example` (new, committed) with descriptive comment
- Lint and build pass

### Summary

`ask.ts` was duplicating `const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` — the same expression already present in `http.ts`. Fixed by exporting `API_URL` from `http.ts` and importing it in `ask.ts`; the default URL literal now appears exactly once. Created `src/vite-env.d.ts` with a `vite/client` reference and an `ImportMetaEnv` / `ImportMeta` augmentation — `VITE_API_URL` now types as non-optional `string` rather than `string | undefined` from Vite's default index signature. Added `apps/frontend/.env.example` for onboarding. No behavior change; SSE in `ask.ts` still uses native `fetch`. Lint and build clean.

---

## Backend Hardening — env example, OpenAI errors, BullMQ retries, /ask rate limiting (Step 77)

**Branch:** step-77-hardening
**Completed:** 2026-06-17

### Goals

- New `apps/backend/.env.example` with all 12 NestJS env vars (placeholder values, one-line comments, `DB_PORT=5433`)
- Root `.env.example` gains a header comment clarifying it covers Docker Compose only
- `EmbedService.batchEmbedRace` fail-fast on OpenAI error: re-throws with `raceId` and `resultId` context; new test in `embed.service.spec.ts`
- BullMQ retry config: `registerQueue` adds `defaultJobOptions` with `attempts: 3`, exponential backoff `delay: 2000ms` — both as named constants
- `@nestjs/throttler` installed; `ThrottlerModule` registered in `AskModule` (scoped, not global); `@UseGuards(ThrottlerGuard)` on `AskController`; 10 req / 60 s limit with named constants
- `ask.controller.spec.ts` extended: new test asserting `ThrottlerGuard` is applied to the controller class
- `pnpm --filter backend lint` and `pnpm --filter backend test` pass (163 total)

### Summary

Created `apps/backend/.env.example` listing all 12 NestJS env vars with placeholder values and a `# DB_PORT=5433` note explaining the Docker port mapping. Added a clarifying header comment to the root `.env.example` pointing readers to the backend-specific file. Wrapped `batchEmbedRace`'s per-result embed call in a `try/catch` that re-throws with `{ cause: error }` and a message including both `raceId` and `result.id` — the `preserve-caught-error` lint rule required `cause` chaining. Added `EMBED_JOB_ATTEMPTS = 3` and `EMBED_BACKOFF_DELAY_MS = 2000` constants; wired them into `defaultJobOptions` in `BullModule.registerQueue`. Installed `@nestjs/throttler@6.5.0`; TTL is in milliseconds in v5+. `ThrottlerModule.forRoot([{ ttl: ASK_THROTTLE_TTL_MS, limit: ASK_THROTTLE_LIMIT }])` registered in `AskModule` only. `@UseGuards(ThrottlerGuard)` applied at the class level on `AskController`. The 429 guard test uses `Reflect.getMetadata('__guards__', AskController)` — the guard fires at the HTTP layer, not inside the method body, so reflection-based verification is the appropriate unit-test approach. 163/163 tests pass.

---

## Step 80 — EmbeddingStatus Indicator

**Branch:** step-80-embedding-status
**Completed:** 2026-06-17

### Goals
- `RaceDto` gains `embeddingStatus: 'pending' | 'complete' | 'failed'`
- `Race` entity has `embeddingStatus` property → `embedding_status` varchar(20) column with DB default `'pending'`
- `EmbedModule` adds `Race` to `TypeOrmModule.forFeature([RaceResult, Race])`
- `EmbedProcessor.process()` sets `'complete'` after `batchEmbedRace` resolves
- `EmbedProcessor.onFailed()` sets `'failed'`; guarded so it cannot throw out of the event handler
- `RacesService.findAll()` maps `embeddingStatus` into the returned `RaceDto`
- `RaceCard` renders status badge only when `!== 'complete'`; distinct copy for `'pending'` vs `'failed'`
- `RacesPage` polls every 3 s while any race is `'pending'`; stops polling otherwise
- Two new processor tests: `process()` sets `'complete'`; `onFailed()` sets `'failed'`
- All four quality gates pass

### Summary

Added `EMBED_STATUS = { PENDING, COMPLETE, FAILED } as const` and `EmbedStatus` type to `embed.constants.ts`. Extended `RaceDto` with `embeddingStatus` (literal union), added the TypeORM `@Column` to `Race` entity using `EMBED_STATUS.PENDING` as the column default. `EmbedModule` now registers both `Race` and `RaceResult` via `forFeature`. `EmbedProcessor` injects `@InjectRepository(Race)` and calls `raceRepo.update()` in both `process()` (→ `complete`) and `onFailed()` (→ `failed`); the `onFailed` write is fire-and-forget (`.catch` log only) so the event handler can never throw. `RacesService.findAll()` now maps `row.embeddingStatus` into each `RaceDto`. `RaceCard` renders `"Indexing for AI…"` (muted) or `"AI indexing failed"` (danger) as `<span>` badges with `aria-label` attributes. `RacesPage` uses a `refetchInterval` callback that returns `POLL_INTERVAL_MS = 3000` when any race is `'pending'` and `false` otherwise. Processor spec updated with mock `raceRepo: { update: jest.fn() }` and three new test cases. 166/166 tests pass.

---

## Step 81 — Fluid Typography

**Branch:** step-81-fluid-typography
**Completed:** 2026-06-17

### Goals
- Replace 5 fixed `rem` font-size tokens with a 7-token fluid `clamp()` scale
- Add `--font-size-lg` and `--font-size-2xl` as new tokens
- Add `--line-height-tight/snug/base` and `--font-weight-regular/medium/semibold/bold` token groups
- Set `body { line-height: var(--line-height-base) }`
- Migrate `EmptyState .icon` off hardcoded `2rem` → `var(--font-size-2xl)`
- Repoint `RaceHeader .name` from `--font-size-xl` to `--font-size-2xl` (preserves 2rem desktop size)
- Frontend lint and build pass

### Summary

Replaced the five fixed `rem` font-size tokens in `index.css` with a seven-token fluid type scale using `clamp()`. Scale spans from min at 375px to max at 1280px via the formula `calc(min + (max - min) * (100vw - 23.4375rem) / 56.5625)`. All five pre-existing token names are unchanged so no consumer breakage; `--font-size-xl` max is now `1.5rem` (was `2rem`) with `RaceHeader .name` repointed to `--font-size-2xl` (max `2rem`) to preserve desktop appearance. Defined `--line-height-tight: 1.2`, `--line-height-snug: 1.4`, `--line-height-base: 1.5` and `--font-weight-regular/medium/semibold/bold` token groups — component migration of hardcoded values is deferred. Added `line-height: var(--line-height-base)` to `body`. Fixed the sole hardcoded font-size literal: `EmptyState.module.css` `.icon` now references `var(--font-size-2xl)`. Only three files changed; no JS, no behavior.

---
