# Implementation Task: Database Connection Module (TypeORM + Config)

## What to build
Wire TypeORM into the NestJS backend via `TypeOrmModule.forRootAsync`, reading PostgreSQL connection parameters from `@nestjs/config`, registering the four existing entities, with `synchronize: false` and `autoLoadEntities: true`. This is the connection wiring only — no migrations, no repositories, no new tables.

## Current state
- `apps/backend/src/app.module.ts` — bare module: `imports: []`, no `ConfigModule`, no `TypeOrmModule`. (NOTE: PLAN step 8 claims `@nestjs/config` is configured, but it is NOT imported here. This step must add it.)
- `apps/backend/src/main.ts` — bootstrap reads `process.env.PORT` / `process.env.CORS_ORIGIN` directly (no ConfigService); helmet + global ValidationPipe + CORS already set up.
- `apps/backend/.env` exists with: `DB_HOST=localhost`, `DB_PORT=5433`, `DB_USER=ocr_user`, `DB_PASSWORD=ocr_pass`, `DB_NAME=ocr_db` (plus `QDRANT_URL`, `QDRANT_API_KEY`, `OPENAI_API_KEY`, `CORS_ORIGIN`). No `.env.example` exists.
- Entities (all complete, `@Entity` decorated):
  - `apps/backend/src/entities/race.entity.ts` → `races`
  - `apps/backend/src/entities/athlete.entity.ts` → `athletes`
  - `apps/backend/src/entities/race-result.entity.ts` → `race_results`
  - `apps/backend/src/entities/obstacle-split.entity.ts` → `obstacle_splits`
- No existing `config/` or `database/` module under `apps/backend/src/`.
- Relevant packages: `@nestjs/config ^4.0.4`, `@nestjs/typeorm ^11.0.1`, `pg ^8.21.0`, `typeorm ^1.0.0` (⚠ see Notes), `@nestjs/common ^11`.
- Docker Compose runs PostgreSQL on host port **5433** (matches `DB_PORT`).

## Deliverables (definition of done)
1. `ConfigModule.forRoot({ isGlobal: true })` registered in `app.module.ts` imports.
2. `TypeOrmModule.forRootAsync` registered in `app.module.ts`, injecting `ConfigService` to read DB params.
3. Connection config uses exactly these env keys: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.
4. `type: 'postgres'` driver configured.
5. `synchronize: false` is set explicitly.
6. `autoLoadEntities: true` is set AND all four entities listed explicitly in `entities: [Race, Athlete, RaceResult, ObstacleSplit]`.
7. `DB_PORT` is parsed to a number (`parseInt` or `+config.get(...)`).
8. Backend boots with `pnpm --filter backend start:dev` against the running Docker Postgres with no errors.
9. No regression — existing helmet / CORS / ValidationPipe behaviour in `main.ts` unchanged.
10. `pnpm --filter backend build` passes.
11. `pnpm --filter backend lint` passes.

## Rules that must hold
- `synchronize` MUST be `false` — never auto-sync schema; schema changes go through migrations.
- No `any` types. Read config values via injected `ConfigService`, not raw `process.env`, inside the TypeORM factory.
- Follow NestJS module conventions per CLAUDE.md. Named exports.
- Do not commit `.env` or any secrets.
- No magic numbers — if a default port is needed as a fallback, extract a named constant.

## Build steps
1. Verify the actually-installed `typeorm` version (see Notes — `^1.0.0` is suspect). Run `pnpm --filter backend list typeorm` and confirm API compatibility.
2. Add `ConfigModule.forRoot({ isGlobal: true })` to `app.module.ts` imports.
3. Add `TypeOrmModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config: ConfigService) => ({ ... }) })` to imports.
4. In the factory: set `type: 'postgres'`, read the five `DB_*` env vars via `ConfigService`, parse `DB_PORT` to number, set `synchronize: false`, `autoLoadEntities: true`, and `entities: [Race, Athlete, RaceResult, ObstacleSplit]`.
5. Start Docker (`docker compose up -d`), then run `pnpm --filter backend start:dev` and confirm clean connection in logs.
6. Run `pnpm --filter backend build` and `pnpm --filter backend lint` — fix until both pass.

## Notes for the implementer
**⚠ Version flag:** `package.json` pins `"typeorm": "^1.0.0"`. TypeORM's published line is `0.3.x` — `1.0.0` may be nonexistent or resolve to an unexpected package. Verify the installed version before writing code; correct the pin if needed.

**Config inconsistency:** `app.module.ts` has empty `imports: []` with no `ConfigModule` despite step 8 being marked done. This step must add it.

**SSL:** local Docker Postgres needs no SSL — omit for now. Add a conditional later for production.

**TypeORM logging:** suggest `logging: ['error']` or `false` for dev — implementer's call.

**Migrations:** fully out of scope. Do not configure `migrations` or `migrationsRun`.

**Out of scope:** migrations, repositories, CSV parser (step 14), refactoring `main.ts` env reads, schema/table creation, `.env.example`.