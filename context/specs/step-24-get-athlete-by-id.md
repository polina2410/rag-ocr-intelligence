# Implementation Task: GET /athletes/:id — Athlete with All Race Results

## What to build
A new `GET /athletes/:id` endpoint that returns a single athlete plus every race result they have, with each result carrying its parent race's metadata and the result's obstacle splits. Mirrors the `GET /races/:id` pattern, but inverts the relationship: the athlete is the root, and each result embeds a `race` (not an `athlete`).

## Current state
- `apps/backend/src/athletes/athletes.controller.ts` — only has `GET /athletes` (`findAll`); no `:id` route, no `ParseUUIDPipe` import.
- `apps/backend/src/athletes/athletes.service.ts` — only `findAll`; constructor injects `Repository<Athlete>` only.
- `apps/backend/src/athletes/athletes.module.ts` — `TypeOrmModule.forFeature([Athlete])` only.
- `apps/backend/src/athletes/athletes.service.spec.ts` — tests `findAll` only; uses a hand-rolled `mockAthleteRepo` (no `findOne` mock yet).
- `apps/backend/src/entities/athlete.entity.ts` — `Athlete` entity. **Has NO inverse relation to `RaceResult`** (no `@OneToMany`).
- `apps/backend/src/entities/race-result.entity.ts` — `RaceResult` has `@ManyToOne(() => Athlete)` with `@JoinColumn({ name: 'athlete_id' })` but **no inverse function argument** pointing back to the athlete; has `@OneToMany('ObstacleSplit', 'raceResult')` for `splits`.
- `apps/backend/src/entities/race.entity.ts` — `Race`; `distanceKm` is `numeric` and comes back from PG as a string — must be coerced with `Number(...)`.
- `apps/backend/src/entities/obstacle-split.entity.ts` — `ObstacleSplit`.
- Pattern reference: `apps/backend/src/races/races.service.ts` `findOne` + `races.controller.ts` + `races.service.spec.ts`.
- Shared types (`packages/types/src/`, exported as `@ocr/types`):
  - `athlete.dto.ts` → `AthleteDto`
  - `race.dto.ts` → `RaceDto`
  - `race-detail.dto.ts` → `RaceResultDto`, `ObstacleSplitDto`, `RaceDetailDto`
  - `paginated.dto.ts` → `PaginatedResponse<T>`
  - `index.ts` re-exports each with `.js` suffix. (`index.d.ts` is a stale build artifact — edit `index.ts` only.)
  - **No `AthleteDetailDto` exists yet — it must be created.**

## Deliverables (definition of done)
1. New file `packages/types/src/athlete-detail.dto.ts` exporting `AthleteResultDto` and `AthleteDetailDto` with the shape defined in Build step 1.
2. `packages/types/src/index.ts` updated with `export * from './athlete-detail.dto.js'`.
3. `AthletesService.findOne(id: string): Promise<AthleteDetailDto>` — loads athlete with `results → race` and `results → splits`; throws `NotFoundException` (`Athlete ${id} not found`) when missing; maps to `AthleteDetailDto`.
4. `AthletesController` has a `@Get(':id')` handler using `@Param('id', ParseUUIDPipe)` returning `Promise<AthleteDetailDto>`.
5. `Athlete` entity gains an inverse `@OneToMany` to `RaceResult`; `RaceResult.athlete` `@ManyToOne` is updated with the inverse function argument.
6. `athletes.module.ts` registers `[Athlete, RaceResult, Race, ObstacleSplit]` in `forFeature`.
7. Results ordered by race `date` descending (most recent first); splits ordered by `obstacleNumber` ascending.
8. `distanceKm` on every embedded `RaceDto` is a JS `number`, not a string.
9. Unit tests in `athletes.service.spec.ts` covering: happy path (athlete + results + race + splits), `NotFoundException`, `results: []`, `splits: []`, nullable result fields as `null`, results ordered by race date desc, splits ordered by obstacleNumber asc, `distanceKm` coerced to number. Existing `findAll` tests still pass.
10. `pnpm --filter backend lint`, `pnpm --filter backend build`, and `pnpm --filter backend test` all pass.

## Rules that must hold
- Named exports only; no `any`.
- `ParseUUIDPipe` on `:id` — malformed UUID yields 400.
- `NotFoundException` message: `` `Athlete ${id} not found` ``.
- Backward-compatible: do not change `findAll`, existing DTOs, or `RaceDetailDto`. The entity relation changes must not break `GET /races/:id`.
- `index.ts` re-exports use `.js` suffix (ESM convention).
- `distanceKm` must be coerced with `Number()` on every embedded race.
- Use string-based `@OneToMany('RaceResult', 'athlete')` on `Athlete` entity to avoid circular value imports (consistent with `race.entity.ts`).
- No Swagger decorators (step 25).

## Build steps
1. Create `packages/types/src/athlete-detail.dto.ts`:
   ```ts
   import type { AthleteDto } from './athlete.dto.js'
   import type { RaceDto } from './race.dto.js'
   import type { ObstacleSplitDto } from './race-detail.dto.js'

   export interface AthleteResultDto {
     id: string
     race: RaceDto
     overallPosition: number | null
     finishTimeSeconds: number | null
     status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'
     categoryPosition: number | null
     genderPosition: number | null
     splits: ObstacleSplitDto[]
   }

   export interface AthleteDetailDto extends AthleteDto {
     results: AthleteResultDto[]
   }
   ```
2. Add `export * from './athlete-detail.dto.js'` to `packages/types/src/index.ts`.
3. In `apps/backend/src/entities/athlete.entity.ts`: add `import type { RaceResult } from './race-result.entity'`; add `@OneToMany('RaceResult', 'athlete') results!: RaceResult[]`; import `OneToMany` from `typeorm`.
4. In `apps/backend/src/entities/race-result.entity.ts`: update the athlete `@ManyToOne` to `@ManyToOne(() => Athlete, (athlete) => athlete.results)`.
5. Update `athletes.module.ts` `forFeature` to `[Athlete, RaceResult, Race, ObstacleSplit]`; add the missing entity imports.
6. Implement `AthletesService.findOne(id)`:
   - `athleteRepo.findOne({ where: { id }, relations: ['results', 'results.race', 'results.splits'] })`
   - If null → throw `NotFoundException`
   - Sort results by `result.race.date` desc (use `localeCompare` for string dates)
   - Map to `AthleteDetailDto`: top-level athlete fields; each result maps per-result fields + `race` as `RaceDto` with `distanceKm: Number(result.race.distanceKm)` + `splits` sorted by `obstacleNumber` asc
7. Add `@Get(':id')` to `AthletesController`: import `Param, ParseUUIDPipe`; delegate to `this.athletesService.findOne(id)`; return type `Promise<AthleteDetailDto>`.
8. Extend `athletes.service.spec.ts`: add `findOneMock` to the mock repo; add `makeRace`/`makeResult`/`makeSplit` factories (mirror `races.service.spec.ts`); add `describe('findOne', ...)` block covering all cases in deliverable 9.
9. Run `pnpm --filter backend lint && pnpm --filter backend build && pnpm --filter backend test`; fix until green.

## Notes for the implementer
**Critical:** `Athlete` has no inverse `@OneToMany` and `RaceResult.athlete` has no inverse arg — `relations: ['results', ...]` will fail until steps 3–4 are done. This is the most important change.

**`distanceKm` coercion:** each embedded race must call `Number(result.race.distanceKm)` — TypeORM returns PG `numeric` as a string.

**Date ordering:** `date` is stored as `type: 'date'` (string). Sort with `b.race.date.localeCompare(a.race.date)` for descending order.

**`index.d.ts` is stale:** it is a build artifact. Edit `index.ts` only.

**Edge cases:** athlete with zero results → `results: []`, 200; result with zero splits → `splits: []`; nullable position/time fields pass through as `null`.

**Out of scope:** pagination of results, filtering, aggregates, frontend, Swagger (step 25).

**Files affected:**
- New: `packages/types/src/athlete-detail.dto.ts`
- Modified: `packages/types/src/index.ts`, `apps/backend/src/entities/athlete.entity.ts`, `apps/backend/src/entities/race-result.entity.ts`, `apps/backend/src/athletes/athletes.controller.ts`, `apps/backend/src/athletes/athletes.service.ts`, `apps/backend/src/athletes/athletes.module.ts`, `apps/backend/src/athletes/athletes.service.spec.ts`

**Open questions:**
1. Embedding the full `RaceDto` per result duplicates race metadata if an athlete has results across few races. Acceptable for now (spec assumes full `RaceDto`).
2. Result ordering: spec uses race `date` DESC. Confirm if a different ordering is expected.