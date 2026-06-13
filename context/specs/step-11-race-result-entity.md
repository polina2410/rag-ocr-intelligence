# Implementation Task: RaceResult TypeORM Entity

## What to build

A single TypeORM entity class `RaceResult` mapped to a PostgreSQL `race_results` table at `apps/backend/src/entities/race-result.entity.ts`. It is the join/fact table linking one `Athlete` to one `Race` with that athlete's outcome in the race (position, time, status, category). Follow the Race and Athlete entity conventions exactly.

## Current state

- `apps/backend/src/entities/race.entity.ts` — reference entity (step 9 ✅). `@Entity('races')`, uuid PK, named-constant varchar lengths, `numeric` for `distanceKm`, snake_case DB column names.
- `apps/backend/src/entities/athlete.entity.ts` — reference entity (step 10 ✅). Same conventions.
- `packages/types/src/index.ts` — exports `race.dto.js` and `athlete.dto.js` only. **No `RaceResultDto` exists.**
- `packages/types/src/race.dto.ts` — `RaceDto` (id, name, date, location, distanceKm, totalObstacles, raceType union).
- `packages/types/src/athlete.dto.ts` — `AthleteDto` (id, firstName, lastName, nationality, category — all `string`).
- No `entities/index.ts` barrel; `app.module.ts` not wired for TypeORM (deferred to step 13).
- PLAN context: step 15 maps CSV data rows to `RaceResult` and `ObstacleSplit` objects; step 22 `GET /races/:id` returns "race with results and splits"; step 24 `GET /athletes/:id` returns "athlete with all race results". This confirms `RaceResult` has FK relations to BOTH `Race` and `Athlete`, and that `ObstacleSplit` (step 12) will later relate to `RaceResult`.

## Deliverables (definition of done)

1. New file `apps/backend/src/entities/race-result.entity.ts` exporting named class `RaceResult`.
2. `@Entity('race_results')` — explicit, pluralized, snake_case table name.
3. Column `id`: `@PrimaryGeneratedColumn('uuid')`, TS type `string`.
4. FK to `Race` via:
   - `@ManyToOne(() => Race)` (no inverse side required for this step)
   - `@JoinColumn({ name: 'race_id' })`
   - property `race!: Race`
   - plus an explicit scalar column `@Column({ type: 'uuid', name: 'race_id' })` `raceId!: string`
5. FK to `Athlete` via:
   - `@ManyToOne(() => Athlete)`
   - `@JoinColumn({ name: 'athlete_id' })`
   - property `athlete!: Athlete`
   - plus scalar `@Column({ type: 'uuid', name: 'athlete_id' })` `athleteId!: string`
6. Column `overallPosition`: `@Column({ type: 'int', name: 'overall_position', nullable: true })`, TS type `number | null` (null when DNF/DNS).
7. Column `finishTimeSeconds`: `@Column({ type: 'int', name: 'finish_time_seconds', nullable: true })`, TS type `number | null` (total elapsed time as integer seconds; null when not finished).
8. Column `status`: `@Column({ type: 'varchar', length: STATUS_MAX_LENGTH, name: 'status', default: 'FINISHED' })`, TS type `'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`. Stored as `varchar`, NOT Postgres enum.
9. Column `categoryPosition`: `@Column({ type: 'int', name: 'category_position', nullable: true })`, TS type `number | null`.
10. Column `genderPosition`: `@Column({ type: 'int', name: 'gender_position', nullable: true })`, TS type `number | null`. **OPEN QUESTION — confirm this field is wanted (see notes).**
11. All varchar lengths extracted to named `const`s — no magic numbers.
12. `Race` and `Athlete` imported by relative path from sibling entity files.
13. `pnpm --filter backend build` passes.
14. `pnpm --filter backend lint` passes.

## Rules that must hold

- Follow Race/Athlete entity conventions exactly: named export, definite assignment (`!`), snake_case DB names, camelCase TS props, named constants, explicit Postgres column `type`.
- `status` maps to `varchar` — do NOT use a Postgres `enum` type.
- Do NOT touch `app.module.ts`, register the entity in any module, or create migrations.
- Do NOT add the inverse `@OneToMany` side on `Race` or `Athlete` — keep relations unidirectional from `RaceResult` so existing ✅ entities stay untouched.
- Do NOT add the `ObstacleSplit` relation — that is step 12.
- No `any`; nullable columns use explicit `T | null` TS types.

## Build steps

1. Create `race-result.entity.ts` in the existing `apps/backend/src/entities/` directory.
2. Import `Entity`, `PrimaryGeneratedColumn`, `Column`, `ManyToOne`, `JoinColumn` from `typeorm`.
3. Import `Race` from `./race.entity` and `Athlete` from `./athlete.entity`.
4. Define named constant `STATUS_MAX_LENGTH = 10`.
5. Declare all properties: uuid PK, two `@ManyToOne` + `@JoinColumn` + scalar id columns, and the result columns with explicit Postgres types and nullability.
6. Run `pnpm --filter backend build` and `pnpm --filter backend lint` — fix until both pass.

## Notes for the implementer

**No `RaceResultDto` exists** in `packages/types/src/`. Columns are inferred from domain context and the PLAN (CSV row mapping, race/athlete projection endpoints). Creating `RaceResultDto` is out of scope here.

**Out of scope:** `ObstacleSplit` relation (step 12), connection module / entity registration (step 13), CSV parser mapping (step 15), DTO↔entity mappers, controllers, services, migrations, audit/timestamp columns, inverse relation sides.

**Files likely affected:** only the new `apps/backend/src/entities/race-result.entity.ts`. No existing file changes.

**Open questions (confirm before implementing):**
1. Does the source CSV provide: overall position, finish time, status (DNF/DNS/DSQ), category position, gender position? Adjust columns to match actual CSV headers from step 14/15.
2. `finishTimeSeconds` as `int` seconds vs. Postgres `interval` — `int` seconds is recommended for easy sorting/aggregation and RAG serialization (step 29).
3. Should `genderPosition` (deliverable 10) be included, or is `categoryPosition` sufficient?
4. Should a unique constraint on `(race_id, athlete_id)` be added? Likely yes, but deferred to step 13 migration work.
5. Whether to keep both the relation object AND the scalar `*_id` column — recommended for projection ergonomics; drop scalars if team prefers relation-only.