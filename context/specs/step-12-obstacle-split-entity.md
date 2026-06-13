# Implementation Task: ObstacleSplit TypeORM Entity

## What to build

A single TypeORM entity class `ObstacleSplit` mapped to a PostgreSQL `obstacle_splits` table at `apps/backend/src/entities/obstacle-split.entity.ts`. It holds per-obstacle timing and penalty data for one athlete in one race, linked by a foreign key to `RaceResult` (one `RaceResult` has many `ObstacleSplit` rows). Follow the Race, Athlete, and RaceResult entity conventions exactly.

## Current state

- `apps/backend/src/entities/race.entity.ts` — reference entity (step 9 ✅). `@Entity('races')`, uuid PK, named-constant varchar lengths, `numeric` for `distanceKm`, snake_case DB column names, explicit Postgres `type`.
- `apps/backend/src/entities/athlete.entity.ts` — reference entity (step 10 ✅). Same conventions.
- `apps/backend/src/entities/race-result.entity.ts` — reference entity (step 11 ✅). Shows the FK pattern: `@ManyToOne(() => X)` + `@JoinColumn({ name: 'x_id' })` + property `x!: X`, PLUS an explicit scalar `@Column({ type: 'uuid', name: 'x_id' })`. Relations are unidirectional (no inverse side). Statuses stored as `varchar`, not Postgres enum.
- `packages/types/src/index.ts` — exports `race.dto.js` and `athlete.dto.js` only. **No `ObstacleSplitDto` and no `RaceResultDto` exist.**
- `packages/types/src/race.dto.ts` — `RaceDto` (id, name, date, location, distanceKm, totalObstacles, raceType union).
- `packages/types/src/athlete.dto.ts` — `AthleteDto` (id, firstName, lastName, nationality, category — all `string`).
- No `entities/index.ts` barrel; `app.module.ts` not wired for TypeORM (deferred to step 13).
- PLAN context: step 15 maps CSV data rows to both `RaceResult` and `ObstacleSplit`; step 22 `GET /races/:id` returns "race with results and splits"; step 55 `ObstacleSplitChart` charts average time per obstacle; step 56 `PenaltyRateChart` charts fail/penalty percentage per obstacle. This confirms `ObstacleSplit` must carry per-obstacle time AND penalty data, FK to `RaceResult`, and be aggregatable by obstacle.

## Deliverables (definition of done)

1. New file `apps/backend/src/entities/obstacle-split.entity.ts` exporting named class `ObstacleSplit`.
2. `@Entity('obstacle_splits')` — explicit, pluralized, snake_case table name.
3. Column `id`: `@PrimaryGeneratedColumn('uuid')`, TS type `string`.
4. FK to `RaceResult` via:
   - `@ManyToOne(() => RaceResult)` (no inverse side added in this step)
   - `@JoinColumn({ name: 'race_result_id' })`
   - property `raceResult!: RaceResult`
   - plus explicit scalar `@Column({ type: 'uuid', name: 'race_result_id' })` `raceResultId!: string`
5. Column `obstacleNumber`: `@Column({ type: 'int', name: 'obstacle_number' })`, TS type `number` — 1-based ordinal of the obstacle within the race.
6. Column `obstacleName`: `@Column({ type: 'varchar', length: OBSTACLE_NAME_MAX_LENGTH, name: 'obstacle_name' })`, TS type `string`.
7. Column `splitTimeSeconds`: `@Column({ type: 'int', name: 'split_time_seconds', nullable: true })`, TS type `number | null` — elapsed time for this obstacle in integer seconds; null when not recorded. **OPEN QUESTION — confirm split = per-obstacle duration vs. cumulative elapsed time (see notes).**
8. Column `penalty`: `@Column({ type: 'boolean', name: 'penalty', default: false })`, TS type `boolean` — whether the athlete incurred a penalty / failed this obstacle.
9. Column `penaltyCount`: `@Column({ type: 'int', name: 'penalty_count', default: 0 })`, TS type `number` — number of penalties incurred. **OPEN QUESTION — confirm whether the CSV records a boolean fail flag or a count (see notes).**
10. All varchar lengths extracted to named `const`s (e.g. `OBSTACLE_NAME_MAX_LENGTH = 255`) — no magic numbers.
11. `RaceResult` imported by relative path from `./race-result.entity`.
12. `pnpm --filter backend build` passes.
13. `pnpm --filter backend lint` passes.

## Rules that must hold

- Follow Race/Athlete/RaceResult entity conventions exactly: named export, definite assignment (`!`), snake_case DB column/table names, camelCase TS props, named constants, explicit Postgres column `type`.
- Any status-like or category-like string column maps to `varchar` — do NOT use a Postgres `enum` type.
- Keep the relation unidirectional from `ObstacleSplit` — do NOT add an inverse `@OneToMany` side on `RaceResult`, so the ✅ step-11 entity stays untouched.
- FK is to `RaceResult` only — do NOT add direct FKs to `Race` or `Athlete`.
- Do NOT touch `app.module.ts`, register the entity in any module, or create migrations.
- Nullable columns use explicit `T | null` TS types. No `any`.

## Build steps

1. Create `obstacle-split.entity.ts` in the existing `apps/backend/src/entities/` directory.
2. Import `Entity`, `PrimaryGeneratedColumn`, `Column`, `ManyToOne`, `JoinColumn` from `typeorm`.
3. Import `RaceResult` from `./race-result.entity`.
4. Define named constant: `OBSTACLE_NAME_MAX_LENGTH = 255`.
5. Declare properties in order: uuid PK; `@ManyToOne` + `@JoinColumn` + scalar `raceResultId`; `obstacleNumber`; `obstacleName`; `splitTimeSeconds`; `penalty`; `penaltyCount` — each with explicit Postgres `type` and correct nullability/defaults.
6. Run `pnpm --filter backend build` and `pnpm --filter backend lint` — fix until both pass.

## Notes for the implementer

**No `ObstacleSplitDto` exists** in `packages/types/src/`. Columns are inferred from domain context and the PLAN (CSV row mapping in step 15; `ObstacleSplitChart` average-time-per-obstacle in step 55; `PenaltyRateChart` fail-percentage-per-obstacle in step 56). Creating `ObstacleSplitDto` is out of scope here.

**Out of scope:** connection module / entity registration (step 13), CSV parser mapping (step 15), DTO↔entity mappers, controllers, services, migrations, unique constraints/indexes, audit/timestamp columns, inverse relation sides on `RaceResult`.

**Files likely affected:** only the new `apps/backend/src/entities/obstacle-split.entity.ts`. No existing file changes.

**Open questions (confirm against the real CSV before implementing):**
1. Is `split_time_seconds` the per-obstacle duration, the cumulative elapsed time at that obstacle, or both? If both are needed, add a second `int` column (e.g. `cumulative_time_seconds`).
2. Does the CSV record penalties as a boolean flag (deliverable 8) or a numeric count (deliverable 9)? Keep only the column(s) that match the source.
3. Is `obstacle_number` provided explicitly in the CSV, or derived from column order during parsing (step 15)?
4. Should a unique constraint on `(race_result_id, obstacle_number)` be added? Likely yes, but deferred to step 13 migration work.
5. Whether to keep both the relation object AND the scalar `race_result_id` column — recommended for projection ergonomics; drop the scalar if team prefers relation-only.
6. Is a separate penalty-time column (time added in seconds per penalty) needed? Not added by default — confirm if penalties carry their own time cost.