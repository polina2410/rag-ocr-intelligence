import type { EmbedService } from '../embed/embed.service.js';
import type {
  QdrantResult,
  RaceResultPayload,
  VectorStoreService,
} from '../vector-store/vector-store.service.js';
import { DEFAULT_TOP_K, RetrieveService } from './retrieve.service.js';

const makePayload = (
  overrides: Partial<RaceResultPayload> = {},
): RaceResultPayload => ({
  raceResultId: 'rr-1',
  raceId: 'race-1',
  athleteId: 'athlete-1',
  athleteName: 'Jane Smith',
  raceName: 'OCR Champ',
  raceDate: '2026-05-10',
  ...overrides,
});

const makeHit = (overrides: Partial<QdrantResult> = {}): QdrantResult => ({
  id: 'rr-1',
  score: 0.92,
  payload: makePayload(),
  ...overrides,
});

interface Harness {
  service: RetrieveService;
  embedFn: jest.Mock;
  queryFn: jest.Mock;
}

const setup = (
  options: {
    vector?: number[];
    hits?: QdrantResult[];
    embedError?: Error;
    queryError?: Error;
  } = {},
): Harness => {
  const {
    vector = [0.1, 0.2, 0.3],
    hits = [],
    embedError,
    queryError,
  } = options;
  const embedFn = embedError
    ? jest.fn().mockRejectedValue(embedError)
    : jest.fn().mockResolvedValue(vector);
  const queryFn = queryError
    ? jest.fn().mockRejectedValue(queryError)
    : jest.fn().mockResolvedValue(hits);
  const embed = { embed: embedFn } as unknown as EmbedService;
  const vectorStore = { query: queryFn } as unknown as VectorStoreService;
  const service = new RetrieveService(embed, vectorStore);
  return { service, embedFn, queryFn };
};

describe('RetrieveService', () => {
  describe('retrieve', () => {
    it('embeds the query once and queries with the embedding and topK', async () => {
      const vector = [0.5, 0.6, 0.7];
      const { service, embedFn, queryFn } = setup({
        vector,
        hits: [makeHit()],
      });

      await service.retrieve('fastest athlete on the monkey bars', 3);

      expect(embedFn).toHaveBeenCalledTimes(1);
      expect(embedFn).toHaveBeenCalledWith(
        'fastest athlete on the monkey bars',
      );
      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(queryFn).toHaveBeenCalledWith(vector, 3);
    });

    it('maps each hit to a RetrievedChunk with id, score, and typed metadata', async () => {
      const payload = makePayload({
        raceResultId: 'rr-9',
        athleteName: 'Max Power',
      });
      const { service } = setup({
        hits: [makeHit({ id: 'rr-9', score: 0.81, payload })],
      });

      const chunks = await service.retrieve('query');

      expect(chunks).toEqual([{ id: 'rr-9', score: 0.81, metadata: payload }]);
    });

    it('uses DEFAULT_TOP_K when topK is omitted', async () => {
      const { service, queryFn } = setup({ hits: [makeHit()] });

      await service.retrieve('query');

      expect(queryFn).toHaveBeenCalledWith(expect.anything(), DEFAULT_TOP_K);
    });

    it('uses an explicit topK over the default', async () => {
      const { service, queryFn } = setup({ hits: [makeHit()] });

      await service.retrieve('query', 10);

      expect(queryFn).toHaveBeenCalledWith(expect.anything(), 10);
    });

    it('returns an empty array when Qdrant returns no hits', async () => {
      const { service } = setup({ hits: [] });

      const chunks = await service.retrieve('query');

      expect(chunks).toEqual([]);
    });

    it('propagates errors from vectorStore.query without wrapping', async () => {
      const error = new Error('Qdrant unavailable');
      const { service } = setup({ queryError: error });

      await expect(service.retrieve('query')).rejects.toBe(error);
    });

    it('propagates errors from embed without wrapping and never queries', async () => {
      const error = new Error('OpenAI down');
      const { service, queryFn } = setup({ embedError: error });

      await expect(service.retrieve('query')).rejects.toBe(error);
      expect(queryFn).not.toHaveBeenCalled();
    });
  });
});
