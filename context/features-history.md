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