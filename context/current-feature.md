# Current Feature: POST /ingest/csv Endpoint

## Status
In Progress

## Goals

- New `apps/backend/src/ingestion/ingestion.service.ts` — `IngestionService.ingestCsv(fileBuffer: Buffer): Promise<{ raceId: string; rowsIngested: number }>` orchestrating parse → persist in a single transaction
- `IngestionController` updated with `@Post('csv')` route using `FileInterceptor('file', CSV_MULTER_OPTIONS)` and `@UploadedFile()`, returns HTTP 201
- `IngestionModule` updated: `TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit])` added to imports; `IngestionService` added to providers
- All entities saved atomically: Race → (per row) Athlete find-or-create → RaceResult → ObstacleSplit[] batch
- `pnpm --filter backend build` and `pnpm --filter backend lint` pass

## Notes

- Spec: `context/specs/step-19-ingest-csv-endpoint.md`
- Athlete dedup: `findOneBy({ firstName, lastName, nationality })` — reuse if found, do NOT update category; insert via transaction manager if not found
- Race always inserted as new (no dedup)
- Transaction: `DataSource.transaction(manager => ...)` — rolls back on any failure
- `DataSource` is auto-provided globally by `TypeOrmModule.forRootAsync` in AppModule
- `FileInterceptor` from `@nestjs/platform-express`; `@HttpCode(HttpStatus.CREATED)` from `@nestjs/common`
- OUT OF SCOPE: error handling / ParseFilePipe (step 20), Swagger decorators (step 25), race dedup

## History

<!-- Completed features are tracked in context/features-history.md -->