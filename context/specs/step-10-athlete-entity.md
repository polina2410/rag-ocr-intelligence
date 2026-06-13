# Implementation Task: Athlete TypeORM Entity

## What to build

A single TypeORM entity class `Athlete` mapped to a PostgreSQL `athletes` table at `apps/backend/src/entities/athlete.entity.ts`. Columns mirror `AthleteDto` in `@ocr/types`. Follow the Race entity conventions exactly.

## Current state

- `apps/backend/src/entities/race.entity.ts` — reference entity (step 9 ✅). `raceType` mapped as `varchar`
- `packages/types/src/athlete.dto.ts` — `AthleteDto` with `id`, `firstName`, `lastName`, `nationality`, `category` (all `string`; `category` has no union)
- `AthleteDto` already exported from `@ocr/types` via `packages/types/src/index.ts`
- No `entities/index.ts` barrel; `app.module.ts` not wired for TypeORM (step 13)

## Deliverables (definition of done)

1. New file `apps/backend/src/entities/athlete.entity.ts` exporting named class `Athlete`
2. `@Entity('athletes')` — explicit, pluralized table name
3. Column `id`: `@PrimaryGeneratedColumn('uuid')`, TS type `string`
4. Column `firstName`: `@Column({ type: 'varchar', length: FIRST_NAME_MAX_LENGTH, name: 'first_name' })`, NOT nullable
5. Column `lastName`: `@Column({ type: 'varchar', length: LAST_NAME_MAX_LENGTH, name: 'last_name' })`, NOT nullable
6. Column `nationality`: `@Column({ type: 'varchar', length: NATIONALITY_MAX_LENGTH })`, NOT nullable
7. Column `category`: `@Column({ type: 'varchar', length: CATEGORY_MAX_LENGTH })`, TS type `AthleteDto['category']`, NOT nullable
8. All varchar lengths extracted to named `const`s — no magic numbers
9. `pnpm --filter backend build` passes
10. `pnpm --filter backend lint` passes

## Rules that must hold

- Follow Race entity conventions exactly — named export, definite assignment (`!`), snake_case DB names, camelCase TS props, named constants
- `category` maps to `varchar` — DTO has no union, do NOT use Postgres `enum`
- Do NOT touch `app.module.ts`, add relations, register the entity, or create migrations

## Build steps

1. Create `athlete.entity.ts` in the existing `apps/backend/src/entities/` directory
2. Import `Entity`, `PrimaryGeneratedColumn`, `Column` from `typeorm`; `import type { AthleteDto } from '@ocr/types'`
3. Define named varchar-length constants
4. Declare five properties with decorators and explicit Postgres column types
5. Run `pnpm --filter backend build` and `pnpm --filter backend lint` — fix until both pass

## Notes for the implementer

**Out of scope:** relations to `Race`/`RaceResult`/`ObstacleSplit` (steps 11–12), connection module (step 13), DTO↔entity mappers, controllers, services, migrations, audit columns.

**Files likely affected:** only the new `apps/backend/src/entities/athlete.entity.ts`. No existing file changes.

**Gotchas:**
- Varchar lengths are unspecified by the DTO — `255` is a sensible default for names/nationality/category.
- `nationality` format assumed free text; if ISO 3166 codes are wanted, `3` chars is sufficient — confirm before implementing.