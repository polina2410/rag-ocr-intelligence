# Implementation Task: Text Serializer — RaceResult to Natural Language Chunk

## What to build
A pure serializer that converts a single `RaceResult` (with its loaded `race`, `athlete`, and `splits[]` relations) into one human-readable natural-language string. This string is the embedding input for step 30 (`EmbedService`). Producing the Qdrant `payload` object is explicitly OUT of scope — this step yields only the text.

## Current state
- No serializer/embed/chunk/retrieve files exist yet — this is net-new code, not a replacement.
- Entities are loaded together via `relations: ['results', 'results.athlete', 'results.splits']` (see `apps/backend/src/races/races.service.ts`).
- `RaceResult` (`apps/backend/src/entities/race-result.entity.ts`): `id`, `race` (relation), `raceId`, `athlete` (relation), `athleteId`, `overallPosition: number | null`, `finishTimeSeconds: number | null`, `status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`, `categoryPosition: number | null`, `genderPosition: number | null`, `splits: ObstacleSplit[]`.
- `Race` (`apps/backend/src/entities/race.entity.ts`): `name`, `date` (ISO string), `location`, `distanceKm` (**stored as numeric — callers wrap with `Number(...)`; the raw entity value may be a string**), `totalObstacles`, `raceType`.
- `Athlete` (`apps/backend/src/entities/athlete.entity.ts`): `firstName`, `lastName`, `nationality`, `category` (e.g. `'M30-34'`).
- `ObstacleSplit` (`apps/backend/src/entities/obstacle-split.entity.ts`): `obstacleNumber`, `obstacleName`, `splitTimeSeconds: number | null`, `penaltyCount` (default 0). **Not guaranteed sorted** — callers must sort by `obstacleNumber`.
- No time-formatting helper exists anywhere in the backend. One must be written.
- Module convention: NestJS `@Injectable()` service, named exports, `.js` import suffixes, no `any`, no magic numbers. Tests are co-located `*.spec.ts` using Jest.

## Deliverables (definition of done)
1. New file `apps/backend/src/serializer/race-result-serializer.service.ts` exporting `RaceResultSerializerService` as an `@Injectable()` with a single public method `serialize(result: RaceResult): string`. (Pure function — no DB/HTTP/async; returns synchronously.)
2. `serialize` accepts a `RaceResult` whose `race`, `athlete`, and `splits` relations are populated, and returns a non-empty single string.
3. The output string includes, in readable prose: athlete full name, athlete nationality, athlete category, race name, race date, race location, race distance (km), and race type.
4. For `status === 'FINISHED'`: the string states the finish time formatted as `H:MM:SS` (or `MM:SS` when under one hour), and includes overall position, category position, and gender position **only when their value is non-null** (null positions are omitted, not rendered as "null" or "0").
5. For `status === 'DNF'`, `'DNS'`, `'DSQ'`: the string explicitly states the non-finishing status in words (e.g. "did not finish (DNF)", "did not start (DNS)", "disqualified (DSQ)") and does NOT assert a finish time or finishing position.
6. Obstacle splits are rendered sorted ascending by `obstacleNumber`. For each split, the text names the obstacle and, when `splitTimeSeconds` is non-null, its split time; when `penaltyCount > 0`, the penalty count is stated.
7. A split with `splitTimeSeconds === null` is still included by name (covers the DNF-attempted-obstacles case) — it is not silently dropped.
8. When `splits` is an empty array, the serializer still returns a valid string describing the athlete and race (no obstacle sentence, no crash).
9. A co-located `apps/backend/src/serializer/race-result-serializer.service.spec.ts` with passing tests covering at minimum: (a) a FINISHED result with all positions present, (b) a DNF result with some null split times, (c) an empty-splits result, (d) the `H:MM:SS` vs `MM:SS` time-format boundary, (e) null positions omitted from output.
10. `pnpm --filter backend test` passes and `pnpm --filter backend lint` passes for the new files.

## Rules that must hold
- Pure synchronous function: no TypeORM repositories, no Qdrant/OpenAI/HTTP calls, no NestJS HTTP decorators. `@Injectable()` is permitted so it can be DI-provided to `EmbedService` in step 30.
- No `any`. Use the `RaceResult` entity type for the input. No magic numbers — extract `SECONDS_PER_HOUR`, `SECONDS_PER_MINUTE`, etc. as named constants.
- Named exports only. ESM `.js` import suffixes consistent with the rest of `apps/backend/src`.
- Do NOT build or return a Qdrant `payload` object — text string only (payload is step 32's concern).
- `distanceKm` may arrive as a string from the numeric column — coerce with `Number(...)` before formatting, matching existing service behavior.
- Do not mutate the input `result` or its `splits` array (sort a copy).
- Output must be deterministic for a given input (no `Date.now()`, no locale-dependent formatting that varies by environment — use raw ISO `YYYY-MM-DD` for dates).

## Build steps
1. Create `apps/backend/src/serializer/race-result-serializer.service.ts`.
2. Add named time-formatting constants (`SECONDS_PER_HOUR`, `SECONDS_PER_MINUTE`) and a private `formatDuration(seconds: number): string` helper producing `H:MM:SS` / `MM:SS` with zero-padded minutes and seconds.
3. Implement `serialize(result)`: build an athlete clause, a race clause, and a result clause (branching on `status`), then an obstacle clause from a sorted copy of `splits`.
4. Assemble the clauses into one readable string and return it.
5. Write `apps/backend/src/serializer/race-result-serializer.service.spec.ts` covering the cases in Deliverable 9.
6. Run `pnpm --filter backend test` and `pnpm --filter backend lint`; fix until green.
7. (Defer) If step 30 requires DI, add `serializer.module.ts` — do NOT wire into `AppModule` in this step.

## Notes for the implementer
- **Out of scope:** the Qdrant payload object, embedding, batching, module wiring into `AppModule`, and any persistence.
- **New files:** `apps/backend/src/serializer/race-result-serializer.service.ts`, `apps/backend/src/serializer/race-result-serializer.service.spec.ts`.
- **Edge cases:** all positions null (FINISHED but unranked); all split times null but obstacles named (DNF mid-course); empty `splits`; `distanceKm` arriving as a string; unsorted `splits`; `penaltyCount === 0` (omit penalty phrase) vs `> 0`.
- **Constraint reminder:** this text is embedded by an LLM, so prefer prose that can be attributed over terse field dumps — keep it factual and free of invented data.
- **DNF splits:** include named obstacles with their available split times even for DNF/DSQ results — the athlete may have completed some obstacles before stopping.
- **Date formatting:** use raw ISO `YYYY-MM-DD` as the deterministic default.