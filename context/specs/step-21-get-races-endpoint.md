# Implementation Task: GET /races Endpoint — Paginated List of Races

## What to build
A `GET /races` endpoint backed by a new `RacesModule` (controller + service) that returns races ordered by `date DESC`, paginated via `page` and `limit` query params, wrapped in a `{ data, total, page, limit }` envelope. No authentication. Read-only — no DB writes.

## Current state
- `apps/backend/src/entities/race.entity.ts` — `Race` entity with columns: `id` (uuid), `name`, `date` (string, `date` type), `location`, `distanceKm` (numeric, db col `distance_km`), `totalObstacles` (int, db col `total_obstacles`), `raceType` (varchar, db col `race_type`).
- `packages/types/src/race.dto.ts` — `RaceDto` already exists and **exactly matches** every `Race` column: `{ id: string; name: string; date: string; location: string; distanceKm: number; totalObstacles: number; raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open' }`. **Reuse as-is; no changes needed.**
- `packages/types/src/index.ts` — barrel re-exporting `race.dto.js`, `race-metadata.dto.js`, `parsed-result.dto.js`, `athlete.dto.js` (note `.js` extensions; package is `"type": "module"`).
- `apps/backend/src/app.module.ts` — registers modules under `imports`; `IngestionModule` imported with a `.js` suffix (`./ingestion/ingestion.module.js`). TypeORM configured with `synchronize: false`.
- `apps/backend/src/ingestion/ingestion.module.ts` — reference module pattern: `TypeOrmModule.forFeature([...])` in imports, controller + services as providers.
- `apps/backend/src/ingestion/ingestion.service.ts` — reference for repository injection: `@InjectRepository(Race) private readonly raceRepo: Repository<Race>`.
- `apps/backend/src/main.ts` — global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })` is active. There is **no** `transform: true`, so query params arrive as strings unless the DTO converts them.
- No `RacesModule`, `RacesController`, or `RacesService` exists anywhere in `apps/backend/src/`.
- No pagination query DTO or response-envelope type exists yet.

## Deliverables (definition of done)
1. New file `apps/backend/src/races/races.module.ts` exporting `RacesModule`, importing `TypeOrmModule.forFeature([Race])`, declaring `RacesController` and `RacesService`.
2. `RacesModule` added to the `imports` array in `apps/backend/src/app.module.ts` (matching the existing `.js`-suffix import convention).
3. New file `apps/backend/src/races/races.controller.ts` exporting `RacesController` with route prefix `races` and a `GET` handler (default route, no sub-path) that accepts the query DTO and returns the paginated envelope.
4. New file `apps/backend/src/races/races.service.ts` exporting `RacesService` that injects the `Race` repository, queries with `order: { date: 'DESC' }`, applies `skip`/`take`, and returns `{ data, total, page, limit }`.
5. New file `apps/backend/src/races/dto/list-races-query.dto.ts` — a `class-validator` DTO for `page` and `limit` with the exact constraints in "Rules".
6. New file `packages/types/src/paginated.dto.ts` exporting `PaginatedResponse<T>` interface; re-exported from `packages/types/src/index.ts` with `.js` extension.
7. `GET /races` returns HTTP 200 with body `{ data: RaceDto[], total: number, page: number, limit: number }`, races ordered by `date DESC`.
8. Invalid query params (e.g. `page=0`, `limit=101`, `limit=abc`) return HTTP 400 via the global `ValidationPipe`.
9. At least one Jest spec in `apps/backend/src/races/` covering: (a) happy path returns correct envelope with mocked repository; (b) edge case — empty result set returns `{ data: [], total: 0, page, limit }`.
10. `pnpm --filter backend lint`, `pnpm --filter backend build`, and `pnpm --filter backend test` all pass.

## Rules that must hold
- **Pagination validation constraints (exact):**
  - `page`: integer, minimum `1`, default `1` (used when omitted).
  - `limit`: integer, minimum `1`, maximum `100`, default `20` (used when omitted).
  - Both are optional in the query string; defaults apply when absent.
  - The DTO must coerce string query values to numbers via `@Type(() => Number)` from `class-transformer`. Verify `class-transformer` is already a backend dependency before using it.
  - `forbidNonWhitelisted: true` is global — the DTO must declare exactly `page` and `limit` and nothing else.
- **`RaceDto` reuse:** import `RaceDto` from `@ocr/types`. Do not redefine, extend, or duplicate it.
- **Response envelope:** add `PaginatedResponse<T>` to `packages/types/src/paginated.dto.ts` and re-export from the barrel with a `.js` specifier. Steps 23/24 will reuse the same shape.
- **Ordering:** `date DESC`. No secondary sort key required.
- NestJS module structure must match the established `module / controller / service / dto` layout (mirror `ingestion/`).
- TypeScript only, no `any`. Service return type must be `PaginatedResponse<RaceDto>`.
- TypeORM returns Postgres `numeric` columns as strings — `distanceKm` must be coerced to `number` in the service.
- Read-only: no writes, no transactions, no auth.
- Named exports for all backend classes.
- No magic numbers — extract `DEFAULT_PAGE`, `DEFAULT_LIMIT`, `MAX_LIMIT` as named constants.

## Build steps
1. **Check `class-transformer`** — verify it appears in `apps/backend/package.json` dependencies. It ships with NestJS scaffolds but confirm before using `@Type`. If absent, flag it; do not silently add it.
2. **`PaginatedResponse<T>` type** — create `packages/types/src/paginated.dto.ts`:
   ```typescript
   export interface PaginatedResponse<T> {
     data: T[];
     total: number;
     page: number;
     limit: number;
   }
   ```
   Add `export * from './paginated.dto.js';` to `packages/types/src/index.ts`.
3. **Query DTO** — create `apps/backend/src/races/dto/list-races-query.dto.ts`:
   ```typescript
   const DEFAULT_PAGE = 1;
   const DEFAULT_LIMIT = 20;
   const MAX_LIMIT = 100;

   export class ListRacesQueryDto {
     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     page: number = DEFAULT_PAGE;

     @IsOptional()
     @Type(() => Number)
     @IsInt()
     @Min(1)
     @Max(MAX_LIMIT)
     limit: number = DEFAULT_LIMIT;
   }
   ```
4. **`RacesService`** — create `apps/backend/src/races/races.service.ts`. Inject `@InjectRepository(Race)`. Implement `findAll(page: number, limit: number): Promise<PaginatedResponse<RaceDto>>`:
   - `skip = (page - 1) * limit`
   - `const [rows, total] = await this.raceRepo.findAndCount({ order: { date: 'DESC' }, skip, take: limit })`
   - Map each row to `RaceDto`, coercing `distanceKm: Number(row.distanceKm)`
   - Return `{ data, total, page, limit }`
5. **`RacesController`** — create `apps/backend/src/races/races.controller.ts`. `@Controller('races')`, `@Get()` handler with `@Query() query: ListRacesQueryDto`, calls `this.racesService.findAll(query.page, query.limit)`.
6. **`RacesModule`** — create `apps/backend/src/races/races.module.ts`. Imports `TypeOrmModule.forFeature([Race])`, declares controller and service.
7. **Wire to `AppModule`** — add `RacesModule` to `imports` in `apps/backend/src/app.module.ts`. Use the `.js` suffix on the import path.
8. **Tests** — create `apps/backend/src/races/races.service.spec.ts` with a mocked `raceRepo`:
   - Happy path: `findAndCount` returns 3 rows → `data` has 3 items, `total` matches, `page`/`limit` echoed.
   - Empty result: `findAndCount` returns `[[], 0]` → `{ data: [], total: 0, page: 1, limit: 20 }`.
9. Run `pnpm --filter backend lint && pnpm --filter backend build && pnpm --filter backend test`; fix until green.

## Notes for the implementer
- **Out of scope:** `GET /races/:id` (step 22), filtering/search, Swagger decorators (step 25), authentication, caching.
- **Gotcha — `numeric` columns as strings:** TypeORM/pg returns `NUMERIC`/`DECIMAL` columns as JavaScript strings. `Number(row.distanceKm)` is the safe coercion; do not skip it.
- **Gotcha — no global `transform`:** without `@Type(() => Number)` the raw string from the query string fails `@IsInt`. The DTO owns the coercion; do not change the global pipe.
- **Gotcha — `forbidNonWhitelisted`:** any extra query key (e.g. `sort`, `filter`) returns 400 automatically. The DTO must not add undeclared properties.
- **Import path convention in AppModule:** existing imports use relative paths ending in `.js` (e.g. `'./ingestion/ingestion.module.js'`). Match this for `'./races/races.module.js'`.
- **Edge cases:** empty table → `{ data: [], total: 0, page: 1, limit: 20 }`; `page` beyond last page → empty `data` array, correct `total`.
- **Open questions (non-blocking):**
  1. `class-transformer` dependency — confirm it's already installed (it almost always is with NestJS, but verify in step 1).
  2. Secondary sort tiebreaker for races on the same date — currently unspecified; leave as-is.
  3. Whether a `page` beyond the last page returns 200 with empty data (assumed yes) or 404 (not assumed).