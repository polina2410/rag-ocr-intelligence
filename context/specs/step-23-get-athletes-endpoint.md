# Implementation Task: GET /athletes Endpoint — Paginated List of Athletes

## What to build
A `GET /athletes` endpoint backed by a new `AthletesModule` (controller + service) that returns athletes ordered by `lastName ASC, firstName ASC`, paginated via `page` and `limit` query params, wrapped in the existing `{ data, total, page, limit }` envelope. No authentication. Read-only — no DB writes. Direct mirror of the existing `GET /races` implementation.

## Current state
- `apps/backend/src/entities/athlete.entity.ts` — `Athlete` entity with columns: `id` (uuid), `firstName` (varchar, db col `first_name`), `lastName` (varchar, db col `last_name`), `nationality` (varchar), `category` (varchar, typed `AthleteDto['category']`). No `numeric` columns — no string coercion needed.
- `packages/types/src/athlete.dto.ts` — `AthleteDto` already exists and exactly matches every `Athlete` column: `{ id: string; firstName: string; lastName: string; nationality: string; category: string }`. Reuse as-is; no changes needed.
- `packages/types/src/paginated.dto.ts` — `PaginatedResponse<T>` interface already exists. Reuse as-is.
- `packages/types/src/index.ts` — barrel already re-exports `athlete.dto.js` and `paginated.dto.js` (`.js` extensions; package is `"type": "module"`).
- `apps/backend/src/races/` — the pattern to mirror exactly:
  - `races.controller.ts` — `@Controller('races')`, `@Get()` with `@Query() query: ListRacesQueryDto`, returns `Promise<PaginatedResponse<RaceDto>>`.
  - `races.service.ts` — injects `@InjectRepository(Race)`, `findAll(page, limit)` uses `findAndCount({ order, skip, take })`, returns `{ data, total, page, limit }`.
  - `races.module.ts` — `TypeOrmModule.forFeature([Race])`, declares controller + service.
  - `dto/list-races-query.dto.ts` — `page`/`limit` with `@Type(() => Number)`, `@IsInt`, `@Min(1)`, `@Max(100)`, defaults `1`/`20`.
  - `races.service.spec.ts` — unit tests with a mocked repository (service is `new`-ed directly with a mock repo).
- `apps/backend/src/app.module.ts` — registers modules under `imports`; existing module imports use `.js` suffix. `Athlete` is already in the TypeORM `entities` array and `autoLoadEntities: true` is set. `synchronize: false`.
- `apps/backend/src/main.ts` — global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`. No `transform: true`, so query params arrive as strings unless the DTO converts them via `@Type`.
- `apps/backend/package.json` — `class-transformer@^0.5.1` and `class-validator@^0.15.1` already present. No new packages required.
- **No `athletes/` directory exists** anywhere in `apps/backend/src/`. All files in this spec are new.

## Deliverables (definition of done)
1. New file `apps/backend/src/athletes/athletes.module.ts` — `AthletesModule` importing `TypeOrmModule.forFeature([Athlete])`, declaring `AthletesController` and `AthletesService`.
2. `AthletesModule` added to the `imports` array in `apps/backend/src/app.module.ts` with the `.js`-suffix path convention.
3. New file `apps/backend/src/athletes/athletes.controller.ts` — `AthletesController` with `@Controller('athletes')` and a `@Get()` handler that accepts `ListAthletesQueryDto` and returns `Promise<PaginatedResponse<AthleteDto>>`.
4. New file `apps/backend/src/athletes/athletes.service.ts` — `AthletesService` injecting the `Athlete` repository, querying with `order: { lastName: 'ASC', firstName: 'ASC' }`, applying `skip`/`take`, mapping rows to `AthleteDto`, returning `{ data, total, page, limit }`.
5. New file `apps/backend/src/athletes/dto/list-athletes-query.dto.ts` — `ListAthletesQueryDto` with `page` (int, min 1, default 1) and `limit` (int, min 1, max 100, default 20).
6. `GET /athletes` returns HTTP 200 with body `{ data: AthleteDto[], total: number, page: number, limit: number }`, athletes ordered `lastName ASC, firstName ASC`.
7. Invalid query params (`page=0`, `limit=101`, `limit=abc`, undeclared key) return HTTP 400 via the global `ValidationPipe`.
8. New Jest spec `apps/backend/src/athletes/athletes.service.spec.ts` covering: (a) happy path returns correct envelope; (b) empty result set returns `{ data: [], total: 0, page, limit }`; (c) correct `skip`/`take`/`order` passed to `findAndCount`; (d) page beyond last returns empty `data` with correct `total`/`page`/`limit`.
9. `pnpm --filter backend lint`, `pnpm --filter backend build`, and `pnpm --filter backend test` all pass.

## Rules that must hold
- **Pagination constraints (mirror `ListRacesQueryDto` exactly):** `page` int ≥ 1, default 1; `limit` int ≥ 1 ≤ 100, default 20. Both optional. `@Type(() => Number)` for coercion. Named constants `DEFAULT_PAGE`, `DEFAULT_LIMIT`, `MAX_LIMIT` — no magic numbers.
- `forbidNonWhitelisted: true` is global — DTO must declare only `page` and `limit`.
- `AthleteDto` and `PaginatedResponse<T>` imported from `@ocr/types` — do not redefine or duplicate.
- **No numeric coercion in the service** — unlike `RacesService`, `Athlete` has no `numeric` columns. Mapping is a straight field copy; do not add `Number()`.
- Return type of `AthletesService.findAll` must be `Promise<PaginatedResponse<AthleteDto>>`.
- Named exports for all backend classes — no default exports.
- No `any` types.
- Read-only: no writes, no transactions, no auth.
- `AppModule` import path uses `.js` suffix.

## Build steps
1. Create `apps/backend/src/athletes/dto/list-athletes-query.dto.ts` — copy `ListRacesQueryDto` pattern, renaming the class to `ListAthletesQueryDto` with the same constants and decorators.
2. Create `apps/backend/src/athletes/athletes.service.ts` — inject `@InjectRepository(Athlete)`. Implement `findAll(page, limit)`: compute `skip = (page - 1) * limit`; call `findAndCount({ order: { lastName: 'ASC', firstName: 'ASC' }, skip, take: limit })`; map rows to `{ id, firstName, lastName, nationality, category }` (no coercion); return `{ data, total, page, limit }`.
3. Create `apps/backend/src/athletes/athletes.controller.ts` — `@Controller('athletes')`, `@Get()` handler, delegates to service.
4. Create `apps/backend/src/athletes/athletes.module.ts` — `TypeOrmModule.forFeature([Athlete])`, controller, service.
5. Add `AthletesModule` to `AppModule` imports (`'./athletes/athletes.module.js'`).
6. Create `apps/backend/src/athletes/athletes.service.spec.ts` — mirror `races.service.spec.ts` `findAll` block. Mock `findAndCount`; assert correct `order`, `skip`, `take`; cover all four cases in deliverable 8.
7. Run `pnpm --filter backend lint && pnpm --filter backend build && pnpm --filter backend test`; fix until green.

## Notes for the implementer
**Out of scope:** `GET /athletes/:id` (step 24), Swagger decorators (step 25), filtering/search, auth, race-result joins.

**Files likely affected:**
- New: `apps/backend/src/athletes/athletes.module.ts`, `athletes.controller.ts`, `athletes.service.ts`, `athletes.service.spec.ts`, `dto/list-athletes-query.dto.ts`
- Modified: `apps/backend/src/app.module.ts` (one line in `imports`)
- No changes to `packages/types/` needed

**Gotchas:**
- Do not copy the `Number(row.distanceKm)` line from `RacesService` — `Athlete` has no numeric columns and TypeORM will return them as the correct JS types already.
- Without `@Type(() => Number)` in the DTO, raw query strings fail `@IsInt`. The global pipe has no `transform: true`, so coercion lives in the DTO.
- `forFeature([Athlete])` is required in the new module even though `Athlete` is in the global TypeORM `entities` array — `forFeature` registers the repository for injection.
- Import path in `AppModule` must end with `.js` (e.g. `'./athletes/athletes.module.js'`).

**Open questions:**
1. Sort order assumed `lastName ASC, firstName ASC`. Confirm if a different ordering is expected.
2. Page beyond last assumed HTTP 200 with empty `data` (consistent with races).