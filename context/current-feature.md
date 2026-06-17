# Current Feature: DELETE /races/:id Endpoint

## Status
In Progress

## Goals

- NEW `VectorStoreService.deleteByRaceId(raceId: string): Promise<void>` — calls `client.delete(RACE_RESULTS_COLLECTION, { filter: { must: [{ key: 'raceId', match: { value: raceId } }] } })`, debug log, errors propagate (no try/catch)
- EXTEND `RacesService` constructor: inject `DataSource`, `@InjectRepository(RaceResult) raceResultRepo`, `@InjectRepository(ObstacleSplit) obstacleSplitRepo`, `VectorStoreService`; add `private readonly logger = new Logger(RacesService.name)`
- NEW `RacesService.remove(id: string): Promise<void>`:
  1. `findOne({ where: { id } })` → throw `NotFoundException('Race ${id} not found')` if null
  2. `dataSource.transaction`: load RaceResult ids → if any: delete ObstacleSplits where `raceResultId IN (ids)` → delete RaceResults where `raceId = id` → delete Race
  3. Skip ObstacleSplit delete entirely if no RaceResults (avoid `IN ()`)
  4. After transaction: best-effort `await this.vectorStoreService.deleteByRaceId(id)` in try/catch; on failure `logger.error`, do NOT rethrow
- `@Delete(':id')` on `RacesController` with `@HttpCode(HttpStatus.NO_CONTENT)`, `@Param('id', ParseUUIDPipe)`, delegates to `racesService.remove(id)`, returns `Promise<void>`
- Swagger: `@ApiOperation`, `@ApiParam`, `@ApiNoContentResponse({ description: 'Race deleted' })`, `@ApiNotFoundResponse`
- EDIT `RacesModule` — add `VectorStoreModule` to `imports`
- UPDATE `vector-store.service.spec.ts` — add `delete: jest.fn()` to `mockClient`; 3 new `deleteByRaceId` tests (happy path asserts filter shape, error propagates, debug log fires)
- UPDATE `races.service.spec.ts` — extend harness with `DataSource`, `RaceResult`/`ObstacleSplit` repo mocks, `VectorStoreService` mock; update constructor call; 4 new `remove` tests (happy path, 404, Qdrant failure still resolves, empty results skips ObstacleSplit delete)
- NEW `races.controller.spec.ts` — mocked `RacesService`; 2 DELETE tests (delegates to `remove`, propagates `NotFoundException`)
- `pnpm --filter backend test` passes, lint passes, build passes

## Notes

- Deletion order inside transaction is load-bearing: ObstacleSplits first, then RaceResults, then Race
- `In` from `typeorm` needed for `ObstacleSplit.delete({ raceResultId: In(ids) })`
- `manager.getRepository(EntityClass)` inside `dataSource.transaction` callback
- Qdrant cleanup is AFTER the transaction commit — 204 returned regardless of Qdrant outcome
- `deleteByRaceId` has no try/catch — best-effort wrapping lives in `RacesService`
- HTTP 204 means NO body — handler returns `void`
- Entities imported from `../entities/` (not `races/`)
- `races.controller.spec.ts` does not exist — create fresh; no need to back-fill `findAll`/`findOne` tests
- Do not modify entities, `synchronize`, or add DB migrations
- Do not cascade-delete `Athlete` rows (athletes are shared across races)
- Spec: `context/specs/step-68-delete-races-endpoint.md`

## History

<!-- Completed features are tracked in context/features-history.md -->