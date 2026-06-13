# Implementation Task: GET /races/:id Endpoint

## What to build
A `GET /races/:id` endpoint that returns a single race by UUID, including all of its race results (each with the athlete) and each result's obstacle splits. Returns `404` when the race does not exist.

## Current state
- `apps/backend/src/races/races.controller.ts` — `@Controller('races')` with only a `@Get()` `findAll` route. No `:id` route.
- `apps/backend/src/races/races.service.ts` — `RacesService` injects `@InjectRepository(Race)` only. Has `findAll(page, limit)` which maps `Race` rows to `RaceDto` and coerces `distanceKm` from string to number (`Number(row.distanceKm)`). No `findOne`/`findById`.
- `apps/backend/src/races/races.module.ts` — imports `TypeOrmModule.forFeature([Race])` only. `RaceResult`, `ObstacleSplit`, `Athlete` are NOT registered here.
- `apps/backend/src/races/races.service.spec.ts` — unit tests for `findAll` using a mocked repo (`new RacesService(mockRaceRepo)`). Note: `distanceKm` stored as numeric is read back as a string by TypeORM, so the mock uses `'5.00' as unknown as number`.
- Entities (`apps/backend/src/entities/`):
  - `Race` — `id, name, date (string), location, distanceKm (numeric -> string at runtime), totalObstacles, raceType`. No relation decorators back to results.
  - `RaceResult` — `id, race (ManyToOne, race_id), raceId, athlete (ManyToOne, athlete_id), athleteId, overallPosition (nullable), finishTimeSeconds (nullable), status ('FINISHED'|'DNF'|'DNS'|'DSQ'), categoryPosition (nullable), genderPosition (nullable)`.
  - `ObstacleSplit` — `id, raceResult (ManyToOne, race_result_id), raceResultId, obstacleNumber, obstacleName, splitTimeSeconds (nullable), penaltyCount`.
  - `Athlete` — `id, firstName, lastName, nationality, category`.
- Shared DTOs (`packages/types/src/`, exported via `@ocr/types`):
  - `RaceDto`, `AthleteDto`, `PaginatedResponse<T>` exist.
  - No `RaceDetailDto`, `RaceResultDto`, or `ObstacleSplitDto` exist yet.
  - `index.ts` re-exports each module with a `.js` suffix (e.g. `export * from './race.dto.js'`). New DTO files MUST follow this pattern.
- `@nestjs/typeorm@^11`, `typeorm@^0.3.x`. `DataSource` wired globally in `AppModule`.

## Deliverables (definition of done)
1. New shared DTO file `packages/types/src/race-detail.dto.ts` defining:
   - `ObstacleSplitDto` — `obstacleNumber: number; obstacleName: string; splitTimeSeconds: number | null; penaltyCount: number`.
   - `RaceResultDto` — `id: string; athlete: AthleteDto; overallPosition: number | null; finishTimeSeconds: number | null; status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'; categoryPosition: number | null; genderPosition: number | null; splits: ObstacleSplitDto[]`.
   - `RaceDetailDto` — all `RaceDto` fields plus `results: RaceResultDto[]`.
2. `packages/types/src/index.ts` updated with `export * from './race-detail.dto.js'`.
3. `RacesService` gains `async findOne(id: string): Promise<RaceDetailDto>` that loads the race with `results -> athlete` and `results -> splits`, maps to `RaceDetailDto`, coerces `distanceKm` to a number, and throws `NotFoundException` when the race does not exist.
4. `RacesController` gains a `@Get(':id')` handler that validates the param as a UUID via `ParseUUIDPipe` and returns `Promise<RaceDetailDto>`.
5. `races.module.ts` registers every entity the service queries via `TypeOrmModule.forFeature` (at minimum `Race`; plus `RaceResult`/`ObstacleSplit`/`Athlete` if injected as separate repositories).
6. `GET /races/{validUuid}` returns `200` with a body matching `RaceDetailDto`, including a populated `results` array where each result has a nested `athlete` object and a `splits` array.
7. `GET /races/{unknownUuid}` returns `404`.
8. `GET /races/{nonUuid}` returns `400` (param validation).
9. Unit tests in `races.service.spec.ts` cover: (a) happy path returns mapped detail with results, athlete, and splits; (b) `distanceKm` coerced to `number`; (c) missing race throws `NotFoundException`. Existing `findAll` tests still pass.
10. `pnpm --filter backend lint`, `pnpm --filter backend build`, and `pnpm --filter backend test` all pass. `packages/types` builds so the new `.js`/`.d.ts` exist for `@ocr/types` consumers.

## Rules that must hold
- No `any` — use proper generics / `unknown`. Named exports only (backend).
- The `:id` param must be validated as a UUID via `ParseUUIDPipe`. A bad UUID must yield `400`, not a DB error.
- DTOs are the contract — controller and service return types must be the shared `@ocr/types` types, not entities. Do not leak entity instances to the client.
- `distanceKm` must be a JS `number` in the response (TypeORM reads `numeric` as a string).
- Follow existing `index.ts` convention: new shared DTO re-exported with `.js` suffix.
- Backward compatible: do not change `findAll`, `RaceDto`, or the `GET /races` response shape.
- Swagger decorators are out of scope for this step (step 25).

## Build steps
1. Create `packages/types/src/race-detail.dto.ts` with `ObstacleSplitDto`, `RaceResultDto`, and `RaceDetailDto` (import `AthleteDto` and `RaceDto` with `.js` suffix as existing files do).
2. Add `export * from './race-detail.dto.js'` to `packages/types/src/index.ts`. Rebuild `packages/types`.
3. Add `@OneToMany` inverse relations on `Race` (to `RaceResult[]`) and on `RaceResult` (to `ObstacleSplit[]`) so TypeORM can load the full graph with `relations: ['results', 'results.athlete', 'results.splits']`. Do not change column names or break ingestion.
4. Update `races.module.ts` `TypeOrmModule.forFeature([...])` to include every entity the service now queries.
5. Implement `RacesService.findOne(id)`: load race + relations; if null throw `NotFoundException`; map entity graph to `RaceDetailDto` (coerce `distanceKm` to `Number`, map each result to `RaceResultDto` with nested `AthleteDto` and `ObstacleSplitDto[]`). Order splits by `obstacleNumber` ascending and results by `overallPosition` ascending (nulls last).
6. Add the `@Get(':id')` controller handler with `@Param('id', ParseUUIDPipe) id: string`, returning `this.racesService.findOne(id)`.
7. Add unit tests per Deliverable 9. Use a mocked repository in the style of the existing spec; mock any additional repos injected.
8. Run lint, build, and tests for the backend; rebuild `packages/types` first so the import resolves.

## Notes for the implementer
**Edge cases:**
- Race exists but has zero results → return `results: []`, still `200`.
- Result with no splits → `splits: []`.
- Nullable result fields (`overallPosition`, `finishTimeSeconds`, `categoryPosition`, `genderPosition`) must pass through as `null`, not coerced to `0`.

**Files likely affected:**
- `packages/types/src/race-detail.dto.ts` (new), `packages/types/src/index.ts`
- `apps/backend/src/races/races.controller.ts`, `races.service.ts`, `races.module.ts`, `races.service.spec.ts`
- `apps/backend/src/entities/race.entity.ts` and `race-result.entity.ts` (adding `@OneToMany` inverse relations — verify ingestion flow still works)

**Open questions:**
1. Should results be ordered by `overallPosition` ascending (nulls last), or is a different ordering expected? Assumed `overallPosition` asc, nulls last.
2. `RaceResult.genderPosition` is typed `null` at ingestion time. Confirm it should still be exposed in `RaceResultDto` as `number | null` (assumed yes).