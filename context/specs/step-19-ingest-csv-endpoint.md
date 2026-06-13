# Implementation Task: POST /ingest/csv Endpoint

## What to build
A `POST /ingest/csv` multipart endpoint that receives a CSV file, calls the two parser services, and persists one `Race`, N `Athlete` records (deduped by name + nationality), N `RaceResult` records, and their `ObstacleSplit` records to Postgres — all inside a single transaction. Returns a summary DTO `{ raceId, rowsIngested }`.

## Current state
- `apps/backend/src/ingestion/ingestion.controller.ts` — empty `@Controller('ingest')` shell, no routes.
- `apps/backend/src/ingestion/ingestion.module.ts` — provides/exports `CsvMetadataParserService` and `CsvRowsParserService`, registers `IngestionController`. No `TypeOrmModule.forFeature` yet, no `IngestionService`.
- `apps/backend/src/ingestion/csv-upload.config.ts` — exports `CSV_MULTER_OPTIONS` (memory storage, 10 MB limit, CSV file filter).
- `apps/backend/src/ingestion/csv-metadata-parser.service.ts` — `parseMetadata(csv: string): RaceMetadata`.
- `apps/backend/src/ingestion/csv-rows-parser.service.ts` — `parseRows(csv: string, metadata: RaceMetadata): ParsedRaceResult[]`.
- TypeORM entities: `Race`, `Athlete`, `RaceResult`, `ObstacleSplit` — all exist in `apps/backend/src/entities/`. Entity columns match `RaceMetadata` and `ParsedRaceResult` field names exactly (camelCase ↔ snake_case via TypeORM decorators).
- `@nestjs/typeorm@^11.0.1`, `typeorm@^0.3.20` installed. `DataSource` is wired globally in `AppModule`.
- `@nestjs/platform-express` installed — provides `FileInterceptor`, `UploadedFile`.
- `multer@^2.1.1`, `@types/multer@^2.1.0` installed.

## Deliverables (definition of done)
1. New file `apps/backend/src/ingestion/ingestion.service.ts` — `@Injectable() IngestionService` with method `ingestCsv(fileBuffer: Buffer): Promise<{ raceId: string; rowsIngested: number }>`.
2. `IngestionController` updated with `@Post('csv')` route handler that uses `@UseInterceptors(FileInterceptor('file', CSV_MULTER_OPTIONS))` and `@UploadedFile()`.
3. `IngestionModule` updated:
   - `imports: [TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit])]`
   - `IngestionService` added to `providers`
4. `POST /ingest/csv` with a valid CSV file returns HTTP 201 with body `{ raceId: string, rowsIngested: number }`.
5. All entities saved in a single transaction: `Race` → (per row) `Athlete` upsert → `RaceResult` → `ObstacleSplit[]`.
6. `pnpm --filter backend build` and `pnpm --filter backend lint` pass.

## Rules that must hold
- No `any`. All repository and entity types explicit.
- Business logic lives in `IngestionService`, not in the controller. Controller only handles HTTP concerns (file decorator, status code, calling the service).
- Use `DataSource.transaction(manager => ...)` (or `EntityManager`) for atomicity — if any row fails, the entire upload rolls back.
- Athlete dedup: `findOneBy({ firstName, lastName, nationality })`. If found, reuse existing record (do NOT update category on existing athletes). If not found, create and save via the transaction manager.
- `Race` is always inserted as a new record — no dedup (each CSV upload is a distinct race event).
- `ObstacleSplit` records are saved in a single `save(splits)` batch call per `RaceResult`, not one-by-one.
- Step 20 owns error handling (parse errors → 422, file missing → 400, DB errors → 500). Step 19 lets errors bubble up as unhandled exceptions — do NOT add `try/catch` in this step.
- Return `HttpStatus.CREATED` (201), not 200.

## Build steps
1. **`IngestionModule`** — add `TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit])` to `imports`. Add `IngestionService` to `providers`.
   - Import entities from `'../entities/<name>.entity.js'`.
2. **`IngestionService`** — create `apps/backend/src/ingestion/ingestion.service.ts`:
   ```typescript
   @Injectable()
   export class IngestionService {
     constructor(
       private readonly metadataParser: CsvMetadataParserService,
       private readonly rowsParser: CsvRowsParserService,
       @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
       @InjectRepository(Athlete) private readonly athleteRepo: Repository<Athlete>,
       private readonly dataSource: DataSource,
     ) {}

     async ingestCsv(fileBuffer: Buffer): Promise<{ raceId: string; rowsIngested: number }> {
       const csv = fileBuffer.toString('utf-8');
       const metadata = this.metadataParser.parseMetadata(csv);
       const rows = this.rowsParser.parseRows(csv, metadata);

       const raceId = await this.dataSource.transaction(async (manager) => {
         // 1. Save Race
         const race = manager.create(Race, {
           name: metadata.name, date: metadata.date, location: metadata.location,
           distanceKm: metadata.distanceKm, totalObstacles: metadata.totalObstacles,
           raceType: metadata.raceType,
         });
         const savedRace = await manager.save(Race, race);

         // 2. Per row: find/create Athlete, save RaceResult + splits
         for (const row of rows) {
           let athlete = await this.athleteRepo.findOneBy({
             firstName: row.athlete.firstName,
             lastName: row.athlete.lastName,
             nationality: row.athlete.nationality,
           });
           if (!athlete) {
             athlete = await manager.save(Athlete, manager.create(Athlete, {
               firstName: row.athlete.firstName, lastName: row.athlete.lastName,
               nationality: row.athlete.nationality, category: row.athlete.category,
             }));
           }

           const result = await manager.save(RaceResult, manager.create(RaceResult, {
             raceId: savedRace.id, athleteId: athlete.id,
             overallPosition: row.overallPosition,
             finishTimeSeconds: row.finishTimeSeconds,
             status: row.status,
             categoryPosition: row.categoryPosition,
             genderPosition: row.genderPosition,
           }));

           if (row.splits.length > 0) {
             const splits = row.splits.map((s) =>
               manager.create(ObstacleSplit, {
                 raceResultId: result.id,
                 obstacleNumber: s.obstacleNumber,
                 obstacleName: s.obstacleName,
                 splitTimeSeconds: s.splitTimeSeconds,
                 penaltyCount: s.penaltyCount,
               }),
             );
             await manager.save(ObstacleSplit, splits);
           }
         }

         return savedRace.id;
       });

       return { raceId, rowsIngested: rows.length };
     }
   }
   ```
   Note: `athleteRepo.findOneBy` uses the repository (outside the transaction) to check for existing athletes. This is acceptable for reads in this context; inserts go through the transaction `manager`.
3. **`IngestionController`** — add route:
   ```typescript
   @Post('csv')
   @HttpCode(HttpStatus.CREATED)
   @UseInterceptors(FileInterceptor('file', CSV_MULTER_OPTIONS))
   async ingestCsv(
     @UploadedFile() file: Express.Multer.File,
   ): Promise<{ raceId: string; rowsIngested: number }> {
     return this.ingestionService.ingestCsv(file.buffer);
   }
   ```
   Inject `IngestionService` via constructor.
4. Run `pnpm --filter backend lint` and `pnpm --filter backend build`; fix any issues.
5. Manual smoke test: `curl -F "file=@apps/backend/test/fixtures/DEKA_FIT_Novi_Sad_2024.csv" http://localhost:3000/ingest/csv` — expect `201` with `{ raceId, rowsIngested: 19 }`.

## Notes for the implementer

**Why athlete reads are outside the transaction:** `findOneBy` on the injected `athleteRepo` is a plain SELECT. Running it outside the transaction manager is fine because athlete rows are only written through the transaction manager — there's no write conflict. If strict isolation is needed in future, use `manager.findOneBy(Athlete, ...)` instead.

**`DataSource` injection:** `DataSource` from `typeorm` is auto-provided by `TypeOrmModule.forRootAsync` in `AppModule` (it registers `DataSource` as a global provider). Inject it directly: `constructor(private readonly dataSource: DataSource)`. No extra module registration needed.

**`@HttpCode(HttpStatus.CREATED)`** must be imported from `@nestjs/common` alongside `Post`, `UseInterceptors`, `UploadedFile`, `HttpStatus`, `Controller`.

**`FileInterceptor`** is imported from `@nestjs/platform-express`, not `@nestjs/common`.

**Entity column mapping:** The `Race` entity stores `distanceKm` as column `distance_km` (TypeORM maps via `name` decorator option). TypeORM's `manager.create(Race, { distanceKm: ... })` uses the entity property name, not the column name — the mapping is automatic.

**`category` on existing athletes:** We do NOT update category on existing athlete records. Athletes can race in different categories across events (e.g. age group boundaries). Keeping the first-seen category avoids overwriting historical data. Flag this decision if the product owner ever asks.

**Transaction rollback:** If `manager.save(Race, race)` succeeds but a later `manager.save(RaceResult, ...)` throws, TypeORM rolls back the entire transaction automatically. No partial data will be committed.

**Out of scope for step 19:**
- `ParseFilePipe` / missing-file 400 errors → step 20
- `try/catch` for parse errors → step 20
- Swagger `@ApiConsumes`, `@ApiBody` decorators → step 25
- Race dedup / idempotency → not in the plan