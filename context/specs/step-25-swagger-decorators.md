# Implementation Task: Swagger / OpenAPI Documentation for All Endpoints and DTOs

## What to build
Add OpenAPI (Swagger) documentation to the NestJS backend so every endpoint and its
request/response shapes are described and browsable at an interactive `/docs` UI.
Because the shared response shapes in `@ocr/types` are plain TypeScript interfaces
(no runtime representation), introduce backend-only Swagger response classes that
mirror those interfaces and decorate them with `@ApiProperty`.

## Current state
- `@nestjs/swagger@^11.4.4` is installed (`apps/backend/package.json`) but unused.
- `apps/backend/src/main.ts` — bootstraps the app (helmet, global ValidationPipe,
  CORS) but has **no** `SwaggerModule.setup()`.
- `apps/backend/nest-cli.json` — `compilerOptions: { deleteOutDir: true }`, **no**
  `plugins` array.
- Controllers have no Swagger decorators:
  - `apps/backend/src/ingestion/ingestion.controller.ts` — `POST /ingest/csv`,
    multipart file upload (field `file`), `@HttpCode(201)`, returns
    `{ raceId: string; rowsIngested: number }` (inline object type, no shared DTO).
  - `apps/backend/src/races/races.controller.ts` — `GET /races` →
    `PaginatedResponse<RaceDto>`, `GET /races/:id` → `RaceDetailDto`
    (`id` validated via `ParseUUIDPipe`).
  - `apps/backend/src/athletes/athletes.controller.ts` — `GET /athletes` →
    `PaginatedResponse<AthleteDto>`, `GET /athletes/:id` → `AthleteDetailDto`
    (`id` validated via `ParseUUIDPipe`).
- Query DTOs are already classes (good candidates for `@ApiProperty`/`@ApiPropertyOptional`):
  - `apps/backend/src/races/dto/list-races-query.dto.ts` — `page`, `limit`
    (`@IsOptional`, `@Type(() => Number)`, `@IsInt`, `@Min(1)`, `limit` also `@Max(100)`;
    defaults `page=1`, `limit=20`).
  - `apps/backend/src/athletes/dto/list-athletes-query.dto.ts` — identical shape.
- Shared response shapes are **interfaces** (no runtime, cannot carry decorators),
  in `packages/types/src/`:
  - `race.dto.ts` — `RaceDto { id, name, date, location, distanceKm, totalObstacles,
    raceType: 'Sprint'|'Super'|'DEKA'|'Open' }`
  - `athlete.dto.ts` — `AthleteDto { id, firstName, lastName, nationality, category }`
  - `paginated.dto.ts` — `PaginatedResponse<T> { data: T[], total, page, limit }` (generic)
  - `race-detail.dto.ts` — `ObstacleSplitDto`, `RaceResultDto`,
    `RaceDetailDto extends RaceDto`
  - `athlete-detail.dto.ts` — `AthleteResultDto`, `AthleteDetailDto extends AthleteDto`
  - `status` union in result DTOs: `'FINISHED'|'DNF'|'DNS'|'DSQ'`.
- `apps/backend/tsconfig.json` — `rootDir: "src"`, so files outside `src/` (i.e.
  `packages/types/`) are **not** compiled by `nest build`.

## Chosen approach (decision + justification)
**Option 2 — backend-only Swagger response classes that mirror the shared interfaces.**

Rejected alternatives:
- **Option 1 (Swagger CLI plugin):** The plugin only introspects files compiled by
  `nest build`, which is scoped to `apps/backend/src` (`rootDir: "src"`). The shared
  shapes live in `packages/types/` and are consumed as a built workspace dependency
  (`@ocr/types`), so the plugin cannot see or annotate them. Even within `src`, the
  plugin cannot attach metadata to **interfaces** — they have no runtime
  representation. It would still help the query DTOs, but it cannot solve the core
  response-shape problem and adds build-config coupling. Not adopted as the primary
  mechanism. (May optionally be enabled for query DTOs — see Notes.)
- **Option 3 (convert shared interfaces to classes):** Forces `@nestjs/swagger` +
  decorator/`reflect-metadata` runtime cost into the frontend bundle, risks breaking
  frontend tree-shaking, and changes a package consumed by both apps. Too much churn
  and cross-cutting risk for a portfolio project.

Option 2 keeps `@ocr/types` as pure, tree-shakeable interfaces (frontend unchanged),
isolates all Swagger concerns in the backend, and gives precise control over the
documented schema. Each Swagger response class must `implements` its corresponding
shared interface so the two stay structurally in sync at compile time.

## Deliverables (definition of done)
1. `apps/backend/src/main.ts` configures Swagger via `DocumentBuilder` + `SwaggerModule`,
   served at `GET /docs`, with a title, description, and version set; the app still
   boots and `GET /docs` returns the Swagger UI HTML (HTTP 200).
2. Backend Swagger response classes exist (suggested location:
   `apps/backend/src/common/swagger/` or per-feature `dto/` folders), each
   `implements` its shared interface and decorates every field with `@ApiProperty`
   (or `@ApiPropertyOptional` for nullable fields):
   - `RaceResponseDto implements RaceDto` (enum documented for `raceType`).
   - `AthleteResponseDto implements AthleteDto`.
   - `ObstacleSplitResponseDto implements ObstacleSplitDto`
     (`splitTimeSeconds` nullable).
   - `RaceResultResponseDto implements RaceResultDto` (`athlete` typed as
     `AthleteResponseDto`; `splits` typed as `ObstacleSplitResponseDto[]`; nullable
     positions/time documented; `status` enum documented).
   - `RaceDetailResponseDto implements RaceDetailDto` (extends/duplicates Race fields;
     `results: RaceResultResponseDto[]`).
   - `AthleteResultResponseDto implements AthleteResultDto` (`race: RaceResponseDto`,
     `splits: ObstacleSplitResponseDto[]`).
   - `AthleteDetailResponseDto implements AthleteDetailDto`
     (`results: AthleteResultResponseDto[]`).
   - `IngestCsvResponseDto` with `raceId: string` and `rowsIngested: number`
     (no shared interface exists today — define a backend class to document it).
3. A reusable paginated response is documented for `GET /races` and `GET /athletes`
   such that the Swagger schema shows `{ data: <Item>[], total, page, limit }` with
   the correct item type (e.g. a `PaginatedResponseDto<T>` base/mixin + `@ApiOkResponse`
   with `getSchemaPath`, or two concrete classes `PaginatedRacesResponseDto` /
   `PaginatedAthletesResponseDto`). The rendered schema must reference the real item
   type, not a bare `object`.
4. Query DTOs `ListRacesQueryDto` and `ListAthletesQueryDto` have `@ApiPropertyOptional`
   on `page` and `limit` documenting type integer, minimum 1 (and maximum 100 for
   `limit`) and default values (1 / 20). Existing class-validator decorators and
   defaults remain unchanged.
5. Each controller route is annotated:
   - `@ApiTags(...)` on every controller (`ingest`, `races`, `athletes`).
   - `@ApiOperation({ summary })` on each route.
   - `@ApiOkResponse` / `@ApiCreatedResponse` referencing the correct response class
     (CREATED for `POST /ingest/csv`).
   - `@ApiParam` for the `:id` UUID params on `GET /races/:id` and `GET /athletes/:id`,
     documented as `format: uuid`.
   - Documented error responses where they already occur:
     `@ApiBadRequestResponse` for `POST /ingest/csv` (missing file / bad upload),
     and `@ApiNotFoundResponse` for the `:id` lookups (service throws when not found —
     verify in `races.service.ts` / `athletes.service.ts` before asserting 404).
6. `POST /ingest/csv` documents the multipart body: `@ApiConsumes('multipart/form-data')`
   plus `@ApiBody` describing a single binary `file` field (CSV upload). The Swagger
   UI shows a file picker for this endpoint.
7. `pnpm --filter backend build` succeeds with no TypeScript errors.
8. `pnpm --filter backend lint` passes (no `any`; named constants for any magic
   numbers introduced).
9. Starting the backend (`pnpm --filter backend start:dev`) and opening `/docs` shows
   all 5 endpoints, each with fully-typed request and response schemas (no `object`
   placeholders for documented shapes).

## Rules that must hold
- Do **not** convert the shared interfaces in `packages/types/` to classes; do not add
  `@nestjs/swagger` or decorators to that package. Frontend bundle must be unaffected.
- Swagger response classes must `implements` the corresponding shared interface so a
  shape drift causes a compile error.
- No `any` — use the documented union/enum types (`raceType`, `status`).
- Nullable fields (`splitTimeSeconds`, `finishTimeSeconds`, `overallPosition`,
  `categoryPosition`, `genderPosition`) must be marked nullable in their `@ApiProperty`
  (`nullable: true`) — do not silently drop the `| null`.
- No magic numbers — reuse/extract named constants for pagination bounds rather than
  hardcoding `1`, `20`, `100` inline in decorators where avoidable.
- Follow NestJS module structure and the project's named-export convention for backend.
- Backward compatibility: existing endpoint behavior, status codes, validation, and
  response payloads must not change — this step is documentation-only.
- One class per file.

## Build steps
1. Decide and create the folder for backend Swagger response classes (per-feature
   `dto/` is consistent with existing structure; a shared `common/swagger/` is
   acceptable for `ObstacleSplit`, `Paginated`, and shared item DTOs). Document the
   choice in code organization.
2. Create `RaceResponseDto` and `AthleteResponseDto` (`implements RaceDto` /
   `AthleteDto`), decorate all fields, document the `raceType` enum.
3. Create `ObstacleSplitResponseDto`, then `RaceResultResponseDto` and
   `AthleteResultResponseDto` referencing the item classes by type (so nested schemas
   resolve), documenting the `status` enum and nullable fields.
4. Create `RaceDetailResponseDto` and `AthleteDetailResponseDto` with their `results`
   arrays typed to the result classes.
5. Create the paginated response mechanism (generic base + mixin, or two concrete
   classes) and wire item types for races and athletes.
6. Create `IngestCsvResponseDto` (`raceId`, `rowsIngested`).
7. Add `@ApiPropertyOptional` decorators to `ListRacesQueryDto` and
   `ListAthletesQueryDto` (type, min, max, default) — leave validation logic intact.
8. Annotate `RacesController`, `AthletesController`, `IngestionController` with
   `@ApiTags`, `@ApiOperation`, `@ApiParam`, success responses, error responses, and
   (for ingestion) `@ApiConsumes` + `@ApiBody` for the multipart file.
9. Before asserting 404 docs, read `races.service.ts` and `athletes.service.ts` to
   confirm they throw `NotFoundException` on missing id; document accordingly.
10. Add Swagger bootstrap to `main.ts`: build the document with `DocumentBuilder`
    (title/description/version), `SwaggerModule.createDocument`, `SwaggerModule.setup('docs', ...)`,
    placed so it doesn't conflict with the global ValidationPipe/helmet/CORS setup.
11. Run `pnpm --filter backend build`, then `pnpm --filter backend lint`.
12. Run `pnpm --filter backend start:dev`, open `http://localhost:3000/docs`, and
    verify all 5 endpoints render with typed request/response schemas and the file
    upload picker.

## Notes for the implementer
- **Generics:** `PaginatedResponse<T>` is generic; OpenAPI cannot infer generic type
  args at runtime. Use the `@ApiExtraModels` + `getSchemaPath` + `allOf` mixin pattern,
  or define two concrete paginated classes. Either is acceptable; the schema must
  reference the real item type, not `object`.
- **Nested DTO resolution:** Swagger only includes nested models it can reach via a
  typed property or `@ApiExtraModels`. If a nested schema shows as empty/`object`,
  register it with `@ApiExtraModels`.
- **Optional plugin:** The Swagger CLI plugin (`nest-cli.json` → `compilerOptions.plugins:
  ["@nestjs/swagger"]`) MAY be added to reduce boilerplate on the **class** DTOs
  (query DTOs, response classes) by auto-inferring `@ApiProperty` from types/JSDoc. It
  does **not** replace the manual response classes (interfaces stay non-introspectable)
  and is not required to meet the deliverables. If enabled, re-run `nest build` and
  confirm enums/nullability are still documented correctly (the plugin sometimes needs
  explicit options for unions).
- **multipart/form-data:** `@ApiBody({ schema: { type: 'object', properties: { file:
  { type: 'string', format: 'binary' } } } })` is the conventional shape; verify the
  UI shows a file picker.
- **`/docs` route:** confirm it does not collide with any existing route and is
  reachable given the current CORS config (it is same-origin server-rendered, so CORS
  is not a factor).
- **Open questions:**
  1. Final location for shared Swagger classes — per-feature `dto/` vs `common/swagger/`?
     (Recommendation: per-feature for feature-specific, `common/` for `ObstacleSplit`
     and pagination.)
  2. Should `IngestCsvResponseDto` be promoted into `@ocr/types` as a shared interface
     for frontend reuse, or stay backend-only? (Recommendation: backend-only for this
     step to avoid scope creep; revisit if the frontend consumes it.)
  3. Confirm whether `races.service`/`athletes.service` actually throw 404 on unknown
     id before documenting `@ApiNotFoundResponse` (step 9).