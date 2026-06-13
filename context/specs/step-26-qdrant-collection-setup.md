# Implementation Task: Qdrant Collection Setup (vector-store module bootstrap)

## What to build
Create `apps/backend/src/vector-store/` containing a `VectorStoreModule` and a `VectorStoreService`. On application startup, the service idempotently ensures a Qdrant collection named `race_results` exists with the correct vector size (1536) and Cosine distance. This step only bootstraps the collection and the module skeleton — `upsert` and `query` are stubbed for steps 27–28.

## Current state
- `@qdrant/js-client-rest@^1.18.0` and `openai@^6.42.0` installed in `apps/backend/package.json`.
- `.env` has `QDRANT_URL=http://localhost:6333` and `QDRANT_API_KEY=change_me_before_production`.
- Docker Compose runs `qdrant/qdrant:v1.13.6` on port 6333 with API-key auth (`QDRANT__SERVICE__API_KEY`).
- `ConfigModule.forRoot({ isGlobal: true })` is registered in `apps/backend/src/app.module.ts`. `ConfigService` injectable globally — no re-import of `ConfigModule` needed in feature modules.
- Module-registration convention in `AppModule`: feature modules imported with `.js`-suffix paths (e.g. `./races/races.module.js`).
- Feature-module convention: plain `@Module`, providers array, no `.js` suffix on intra-feature imports.
- Service convention: `@Injectable()`, constructor injection, `async` methods returning typed results, `import type` for type-only imports.
- No `vector-store/` directory or any Qdrant code exists yet.

### Verified Qdrant client v1.18 API
- Constructor: `new QdrantClient({ url, apiKey })`.
- `collectionExists(name): Promise<{ exists: boolean }>` — use this for the idempotency check.
- `createCollection(name, { vectors: { size, distance } }): Promise<boolean>` — `distance` is the string `"Cosine"`.
- `recreateCollection` exists but DELETES existing data — do NOT use it.

## Deliverables (definition of done)
1. `apps/backend/src/vector-store/vector-store.constants.ts` exports named constants:
   - `QDRANT_CLIENT` — injection token (string or `Symbol`) for the client provider.
   - `RACE_RESULTS_COLLECTION = 'race_results'`.
   - `EMBEDDING_DIMENSION = 1536`.
   - `VECTOR_DISTANCE = 'Cosine'` (typed to satisfy the client's `Distance` type).
2. `apps/backend/src/vector-store/vector-store.module.ts`:
   - Registers a `QdrantClient` provider via `useFactory` injecting `ConfigService`, reading `QDRANT_URL` and `QDRANT_API_KEY`, provided under the `QDRANT_CLIENT` token.
   - Registers `VectorStoreService` as a provider.
   - Exports both `VectorStoreService` and the `QDRANT_CLIENT` token (steps 30–32 will consume them).
3. `apps/backend/src/vector-store/vector-store.service.ts`:
   - `@Injectable()`, `implements OnModuleInit`.
   - Injects the `QdrantClient` via `@Inject(QDRANT_CLIENT)`.
   - `onModuleInit()`: calls `collectionExists(RACE_RESULTS_COLLECTION)`; if not present, calls `createCollection` with `{ vectors: { size: EMBEDDING_DIMENSION, distance: VECTOR_DISTANCE } }`. If already present, does nothing.
   - Logs (via NestJS `Logger`) whether the collection was created or already existed.
   - Stub methods `upsert(...)` and `query(...)` with typed signatures that throw `new Error('not implemented')`.
   - No `any` types.
4. `VectorStoreModule` added to `imports` in `apps/backend/src/app.module.ts` with the `.js`-suffix path convention.
5. `pnpm --filter backend build` succeeds.
6. `pnpm --filter backend lint` passes.
7. Manual verification: with `docker compose up -d` running, `pnpm --filter backend start:dev` starts cleanly; on first run `race_results` collection is created; on a second restart it is NOT recreated and no error is thrown. Verify via `GET http://localhost:6333/collections/race_results` returning `vectors.size: 1536`, `distance: "Cosine"`.

## Rules that must hold
- No magic strings or numbers — collection name, dimension, distance, and injection token are named constants.
- No `any` — use the client's exported types or `unknown` + narrowing.
- The collection vector size MUST be 1536 to match the chosen embedding model (`text-embedding-3-small`). If the model changes in step 30, this constant and the collection must change together.
- Startup must be idempotent: restarting the app must never error on an existing collection and must never delete existing vectors (do NOT use `recreateCollection`).
- `ConfigService` only — never read `process.env` directly inside the service.
- Follow existing module conventions: `.js`-suffix path in `AppModule` import; named exports; constructor injection.
- Do not add a controller — no HTTP surface for this step.
- Secrets stay in `.env`; never hard-code the API key or URL.

## Build steps
1. Create `apps/backend/src/vector-store/vector-store.constants.ts` with the four named constants.
2. Create `vector-store.module.ts`: factory provider for `QdrantClient` (`inject: [ConfigService]`, returns `new QdrantClient({ url, apiKey })`); add `VectorStoreService`; export both.
3. Create `vector-store.service.ts`: `OnModuleInit` with the `collectionExists` → conditional `createCollection` logic, a `Logger`, and the two stub methods.
4. Register `VectorStoreModule` in `app.module.ts` imports (`.js` path).
5. Run `pnpm --filter backend build`, then `pnpm --filter backend lint`.
6. Run `docker compose up -d`, then `pnpm --filter backend start:dev` and verify collection creation and idempotency on a second restart.

## Notes for the implementer
- **Embedding model rationale:** `text-embedding-3-small` → 1536 dims, Cosine. Cost-effective, sufficient for portfolio-scale RAG, and the step-30 `EmbedService` must use the same model. Collection dimension is immutable without a destructive recreate — decide before first real data lands.
- **Idempotency:** prefer `collectionExists()` over try/catch on `getCollection`. Never use `recreateCollection` (wipes all stored vectors).
- **Qdrant version warning:** client v1.18 may log a compatibility warning against server v1.13.6. Optionally pass `checkCompatibility: false` to the constructor to silence it — non-blocking.
- **`Distance` type:** the `distance` value is the literal string `"Cosine"` (capital C), typed as the client's `Distance` union. Import the type from `@qdrant/js-client-rest` if TypeScript rejects a plain string literal.
- **Stub signatures for steps 27–28** (define the shape now for cleaner PRs later):
  - `upsert(points: { id: string; vector: number[]; payload: Record<string, unknown> }[]): Promise<void>`
  - `query(vector: number[], topK: number): Promise<{ id: string; score: number; payload: Record<string, unknown> }[]>`
- **Out of scope:** real `upsert`/`query` logic, text serialiser, `EmbedService`, `RetrieveService`, any controller, payload indexes, and OpenAI calls.