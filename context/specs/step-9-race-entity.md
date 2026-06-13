# Implementation Task: Race TypeORM Entity

## What to build

A single TypeORM entity class `Race` mapped to a PostgreSQL `races` table, located at `apps/backend/src/entities/race.entity.ts`. Its columns must align with the existing `RaceDto` shape in `@ocr/types` so the entity can be safely projected to/from that DTO.

## Current state

- `apps/backend/src/` — only: `app.module.ts`, `app.controller.ts`, `app.service.ts`, `app.controller.spec.ts`, `main.ts`. No feature modules, no `entities/` directory
- `apps/backend/src/app.module.ts` — `imports: []`, TypeORM NOT yet wired (deferred to step 13 — do not touch)
- `packages/types/src/race.dto.ts` — defines `RaceDto` (`id`, `name`, `date`, `location`, `distanceKm`, `totalObstacles`, `raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open'`)
- `@ocr/types` is a dependency of backend via `workspace:*` with tsconfig `paths` alias
- Dependencies present: `typeorm ^1.0.0`, `@nestjs/typeorm ^11.0.1`, `reflect-metadata ^0.2.2`, `pg ^8.21.0`
- `apps/backend/tsconfig.json`: `experimentalDecorators: true`, `emitDecoratorMetadata: true`, `strictNullChecks: true`, target ES2023

## Deliverables (definition of done)

1. New file `apps/backend/src/entities/race.entity.ts` exporting named class `Race`
2. Class decorated with `@Entity('races')` — explicit, pluralized table name
3. Column `id`: `@PrimaryGeneratedColumn('uuid')`, TS type `string`
4. Column `name`: `@Column({ type: 'varchar', length: NAME_MAX_LENGTH })`, TS type `string`, NOT nullable
5. Column `date`: `@Column({ type: 'date' })`, TS type `string` (ISO date string, matches `RaceDto.date`), NOT nullable
6. Column `location`: `@Column({ type: 'varchar', length: LOCATION_MAX_LENGTH })`, TS type `string`, NOT nullable
7. Column `distanceKm`: `@Column({ type: 'numeric', precision: DISTANCE_PRECISION, scale: DISTANCE_SCALE, name: 'distance_km' })`, TS type `number`, NOT nullable
8. Column `totalObstacles`: `@Column({ type: 'int', name: 'total_obstacles' })`, TS type `number`, NOT nullable
9. Column `raceType`: `@Column({ type: 'enum', enum: [...], name: 'race_type' })`, TS type `RaceDto['raceType']` — derived from the DTO, not copy-pasted
10. All numeric column constraints extracted to named `const`s — no magic numbers
11. `pnpm --filter backend build` passes with the new file present
12. `pnpm --filter backend lint` passes (no `any`, named export, prettier-clean)

## Rules that must hold

- **No `any`.** `raceType` TS type must be `RaceDto['raceType']` — derive from `@ocr/types`, not a redeclared literal that could drift
- **Named export only** — `export class Race`, no default export
- **snake_case DB column names** (`distance_km`, `total_obstacles`, `race_type`), camelCase TS properties
- **Do NOT touch `app.module.ts`** — entity registration and DB connection are step 13
- **Do NOT add relations** — `Athlete`, `RaceResult`, `ObstacleSplit` are steps 10–12; no relation decorators here
- **No migrations, no DB sync**

## Build steps

1. Create directory `apps/backend/src/entities/`
2. Create `race.entity.ts`: import `Entity`, `PrimaryGeneratedColumn`, `Column` from `typeorm`; import `RaceDto` from `@ocr/types`
3. Define named constants for all column constraints (varchar lengths, numeric precision/scale)
4. Define the four `raceType` values as a `const` array or enum to pass to `enum:` option, typed as `RaceDto['raceType']`
5. Declare all eight properties with their decorators and explicit Postgres column types
6. Run `pnpm --filter backend build` and `pnpm --filter backend lint` — fix until both pass

## Notes for the implementer

**Out of scope:** TypeORM connection module (step 13), other entities and relations (steps 10–12), DTO↔entity mappers, controllers, services, migrations.

**Files likely affected:** only the new `apps/backend/src/entities/race.entity.ts`. No existing file should change.

**Gotchas:**
- `typeorm ^1.0.0` is an atypical major version — verify `@PrimaryGeneratedColumn('uuid')` and `type: 'enum'` API against the actually installed version before writing, not from memory
- `numeric`/`decimal` columns in TypeORM are returned as `string` at runtime by the pg driver despite a `number` TS type — a coercion transformer will be needed when the entity is queried; flag for step 13, do NOT add it here
- `module: nodenext` + `isolatedModules: true` in tsconfig — use `import type` for `RaceDto` if only the type is needed, to satisfy `isolatedModules`
- Numeric precision/scale for `distanceKm` is unspecified by the DTO — pick sensible values (e.g. `precision: 6, scale: 2` for distances up to 9999.99 km) and call out the choice explicitly

**Open questions:**
1. `raceType` as Postgres `enum` vs `varchar` — spec assumes Postgres enum; confirm before step 10 if consistent enum strategy is wanted across all entities
2. `createdAt` / `updatedAt` audit columns — `RaceDto` has none so they are omitted here; decide before steps 10–12 if audit columns are wanted as a cross-cutting pattern