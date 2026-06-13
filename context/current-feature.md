# Current Feature: GET /races Endpoint — Paginated List of Races

## Status
In Progress

## Goals

- `packages/types/src/paginated.dto.ts` — `PaginatedResponse<T>` interface, re-exported from barrel with `.js` specifier
- `apps/backend/src/races/dto/list-races-query.dto.ts` — `page` (int, min 1, default 1) and `limit` (int, min 1, max 100, default 20) with `@Type(() => Number)` coercion
- `apps/backend/src/races/races.service.ts` — `findAll(page, limit)` using `findAndCount`, `date DESC`, `skip`/`take`, coerces `distanceKm` to number, returns `PaginatedResponse<RaceDto>`
- `apps/backend/src/races/races.controller.ts` — `@Controller('races')`, `@Get()` handler, delegates to service
- `apps/backend/src/races/races.module.ts` — `TypeOrmModule.forFeature([Race])`, registers controller and service
- `RacesModule` added to `AppModule` imports with `.js` suffix convention
- `GET /races` returns 200 `{ data: RaceDto[], total, page, limit }` ordered by `date DESC`
- Invalid params (`page=0`, `limit=101`, `limit=abc`) return 400 via global `ValidationPipe`
- Service unit tests: happy path (3 rows) + empty result (`data: [], total: 0`)
- `pnpm --filter backend lint`, `pnpm --filter backend build`, `pnpm --filter backend test` all pass

## Notes

- Spec: `context/specs/step-21-get-races-endpoint.md`
- `RaceDto` already exists in `@ocr/types` — reuse as-is, do NOT redefine
- Confirm `class-transformer` is in `apps/backend/package.json` before using `@Type(() => Number)`
- TypeORM returns `numeric` columns as strings — `Number(row.distanceKm)` coercion required in service
- No global `transform: true` on `ValidationPipe` — `@Type` in DTO owns string→number coercion
- `forbidNonWhitelisted: true` is global — DTO declares only `page` + `limit`, nothing else
- AppModule import path must use `.js` suffix: `'./races/races.module.js'`
- OUT OF SCOPE: `GET /races/:id` (step 22), Swagger (step 25), filtering, auth, caching

## History

<!-- Completed features are tracked in context/features-history.md -->