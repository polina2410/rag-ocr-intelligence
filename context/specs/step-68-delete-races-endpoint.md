# Implementation Task: DELETE /races/:id Endpoint

## What to build
A `DELETE /races/:id` endpoint that removes a race and all its dependent rows (`RaceResult`, `ObstacleSplit`) inside a single DB transaction, then best-effort removes the race's vectors from Qdrant. Returns HTTP 204 with no body.

## Current state
- `apps/backend/src/races/races.service.ts` — has `findAll(page, limit)` and `findOne(id)`. Constructor injects ONLY `@InjectRepository(Race) raceRepo`. No `DataSource`, no `VectorStoreService`.
- `apps/backend/src/races/races.controller.ts` — has `@Get()` and `@Get(':id')`. Already imports `ParseUUIDPipe`, `ApiNotFoundResponse`, `ApiOperation`, `ApiParam`.
- `apps/backend/src/races/races.module.ts` — imports `TypeOrmModule.forFeature([Race, RaceResult, ObstacleSplit, Athlete])`. Does NOT yet import `VectorStoreModule`.
- `apps/backend/src/vector-store/vector-store.service.ts` — has `upsert`, `query`, `onModuleInit`. Has `private readonly logger`. No delete method yet.
- `apps/backend/src/vector-store/vector-store.module.ts` — exports `VectorStoreService` and `QDRANT_CLIENT`.
- `apps/backend/src/vector-store/vector-store.constants.ts` — exports `RACE_RESULTS_COLLECTION = 'race_results'`.
- Entities: `RaceResult` has scalar `raceId: string`; `ObstacleSplit` has scalar `raceResultId: string`. No `onDelete: 'CASCADE'` on any FK; `synchronize: false` — no schema changes allowed.
- `apps/backend/src/races/races.service.spec.ts` — constructs `new RacesService(mockRaceRepo)` with `mockRaceRepo = { findAndCount, findOne }`.
- `apps/backend/src/vector-store/vector-store.service.spec.ts` — `mockClient = { upsert, search }`.
- `apps/backend/src/races/races.controller.spec.ts` — DOES NOT EXIST; create it.

## Deliverables (definition of done)
1. `VectorStoreService.deleteByRaceId(raceId: string): Promise<void>` added — calls `this.client.delete(RACE_RESULTS_COLLECTION, { filter: { must: [{ key: 'raceId', match: { value: raceId } }] } })` with one `this.logger.debug(...)` line. No try/catch — errors propagate to caller.
2. `RacesService.remove(id: string): Promise<void>` added: (a) 404 pre-check, (b) transactional cascade delete in correct order, (c) best-effort Qdrant cleanup with `logger.error` on failure — does not rethrow.
3. `RacesService` constructor extended to inject `DataSource`, `@InjectRepository(RaceResult) raceResultRepo`, `@InjectRepository(ObstacleSplit) obstacleSplitRepo`, and `VectorStoreService`. Adds `private readonly logger = new Logger(RacesService.name)`.
4. `RacesController` gains `@Delete(':id')` handler `remove(@Param('id', ParseUUIDPipe) id: string): Promise<void>` with `@HttpCode(HttpStatus.NO_CONTENT)`, delegating to `racesService.remove(id)`.
5. `RacesModule` imports `VectorStoreModule`.
6. Swagger on the new handler: `@ApiOperation`, `@ApiParam`, `@ApiNoContentResponse({ description: 'Race deleted' })`, `@ApiNotFoundResponse`.
7. `vector-store.service.spec.ts` updated: `delete` added to `mockClient`; 3 new tests for `deleteByRaceId` (happy path asserts filter shape, error propagates, debug log fires).
8. `races.service.spec.ts` updated: harness extended with `DataSource`, `RaceResult` repo, `ObstacleSplit` repo, `VectorStoreService` mocks; constructor call updated; 4 new `remove` tests (see build steps).
9. NEW `races.controller.spec.ts`: DELETE tests — delegates to service, propagates 404.
10. `pnpm --filter backend test` passes — all new and pre-existing tests green. `pnpm --filter backend lint` passes. `pnpm --filter backend build` passes.

## Rules that must hold
- HTTP 204 No Content: handler returns `void`, no response body.
- 404 (`NotFoundException`) thrown BEFORE any deletion. Message: `` `Race ${id} not found` `` (consistent with `findOne`).
- Cascade deletion runs inside ONE `dataSource.transaction(async (manager) => {...})`. Deletion order: (1) load `RaceResult` ids where `raceId = id`; (2) if any ids exist, delete `ObstacleSplit` rows where `raceResultId IN (ids)`; (3) delete `RaceResult` rows where `raceId = id`; (4) delete the `Race` row. Skipping ObstacleSplit delete when results are empty is REQUIRED (avoid `IN ()`).
- Qdrant cleanup runs AFTER the DB transaction, wrapped in try/catch in `RacesService`. On failure: `logger.error`, do NOT rethrow. Return 204 regardless of Qdrant outcome.
- `deleteByRaceId` does NOT swallow errors — best-effort wrapping lives in `RacesService`.
- Do not modify entities, `synchronize`, or add DB migrations.
- No `any`. Reuse existing constants (`RACE_RESULTS_COLLECTION`).
- Entities imported from `../entities/` (not from a `races/` subfolder).

## Build steps
1. Add `deleteByRaceId(raceId: string): Promise<void>` to `VectorStoreService`. `RACE_RESULTS_COLLECTION` is already imported.
2. Extend `RacesService`: add `DataSource` import from `typeorm`; add `RaceResult`, `ObstacleSplit` entity imports; add `VectorStoreService` import; add `Logger` to the `@nestjs/common` import. Update the constructor with new injections. Add `private readonly logger`.
3. Implement `RacesService.remove(id: string)`:
   ```
   const race = await this.raceRepo.findOne({ where: { id } })
   if (!race) throw new NotFoundException(`Race ${id} not found`)
   await this.dataSource.transaction(async (manager) => {
     const results = await manager.getRepository(RaceResult).find({ where: { raceId: id }, select: ['id'] })
     if (results.length > 0) {
       const ids = results.map((r) => r.id)
       await manager.getRepository(ObstacleSplit).delete({ raceResultId: In(ids) })
     }
     await manager.getRepository(RaceResult).delete({ raceId: id })
     await manager.getRepository(Race).delete(id)
   })
   try {
     await this.vectorStoreService.deleteByRaceId(id)
   } catch (err) {
     this.logger.error(`Failed to delete Qdrant vectors for race ${id}`, err)
   }
   ```
   Import `In` from `typeorm` for the `ObstacleSplit` delete.
4. Add `@Delete(':id')` to `RacesController`. Add `Delete`, `HttpCode`, `HttpStatus` to the `@nestjs/common` import. Add `ApiNoContentResponse` to the `@nestjs/swagger` import.
5. Add `VectorStoreModule` to the `imports` array in `RacesModule`.
6. Update `vector-store.service.spec.ts`: add `delete: jest.fn()` to `mockClient`. Add 3 tests in a new `describe('deleteByRaceId')` block.
7. Update `races.service.spec.ts`:
   - Add `mockManager` with `getRepository` returning the right mock repo based on entity.
   - Add `mockDataSource = { transaction: jest.fn().mockImplementation((cb) => cb(mockManager)) }`.
   - Add `mockRaceResultRepo = { find: jest.fn(), delete: jest.fn() }`.
   - Add `mockObstacleSplitRepo = { delete: jest.fn() }`.
   - Add `mockVectorStore = { deleteByRaceId: jest.fn() }`.
   - Update `new RacesService(...)` to pass all 5 args.
   - Add 4 tests for `remove`: (a) happy path, (b) 404, (c) Qdrant failure → still resolves, (d) empty results → ObstacleSplit delete NOT called.
8. Create `races.controller.spec.ts` with a mocked `RacesService`. Add DELETE tests: delegates to `remove`, propagates `NotFoundException`.
9. Run `pnpm --filter backend test`, then lint, then build. Fix any failures.

## Notes for the implementer
- **Out of scope:** step 69 frontend delete button; soft-delete; Athlete cascade (athletes are shared); Qdrant retry/dead-letter; e2e tests.
- **Files changed:** `vector-store.service.ts`, `vector-store.service.spec.ts`, `races.service.ts`, `races.service.spec.ts`, `races.controller.ts`, `races.controller.spec.ts` (NEW), `races.module.ts`.
- **`mockManager.getRepository` pattern:** use a switch or `mockImplementation((entity) => entity === RaceResult ? mockRaceResultRepo : entity === ObstacleSplit ? mockObstacleSplitRepo : mockRaceRepo)` to return the right mock.
- **Qdrant filter shape:** `{ filter: { must: [{ key: 'raceId', match: { value: raceId } }] } }` — verify against the installed `@qdrant/js-client-rest` types if the `delete` method signature differs.
- **`In` import:** `import { DataSource, In, Repository } from 'typeorm'` — needed for the `ObstacleSplit` delete by array of ids.
- **Controller spec:** `races.controller.spec.ts` has no pre-existing content so no back-fill is required for `findAll`/`findOne`; the file only needs to compile and the DELETE tests pass.
- **Import suffix convention:** existing `races.*.ts` files use suffix-less relative imports (no `.js`) — maintain that convention within those files. New cross-module imports (e.g. `VectorStoreService` in `races.module.ts`) should follow the same pattern used by other module-level imports in that file.