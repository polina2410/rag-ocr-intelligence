import type OpenAI from 'openai';
import type { Repository } from 'typeorm';
import type { RaceResult } from '../entities/race-result.entity.js';
import type { RaceResultSerializerService } from '../serializer/race-result-serializer.service.js';
import type { VectorStoreService } from '../vector-store/vector-store.service.js';
import { EMBEDDING_MODEL } from './embed.constants.js';
import { EmbedService } from './embed.service.js';

interface Harness {
  service: EmbedService;
  createFn: jest.Mock;
  findFn: jest.Mock;
  serializeFn: jest.Mock;
  upsertFn: jest.Mock;
}

const setup = (
  options: {
    embedding?: number[];
    results?: Partial<RaceResult>[];
    serialized?: string;
    embedError?: Error;
  } = {},
): Harness => {
  const {
    embedding = [0.1, 0.2, 0.3],
    results = [],
    serialized = 'chunk',
    embedError,
  } = options;
  const createFn = embedError
    ? jest.fn().mockRejectedValue(embedError)
    : jest.fn().mockResolvedValue({ data: [{ embedding }] });
  const findFn = jest.fn().mockResolvedValue(results);
  const serializeFn = jest.fn().mockReturnValue(serialized);
  const upsertFn = jest.fn().mockResolvedValue(undefined);
  const client = {
    embeddings: { create: createFn },
  } as unknown as OpenAI;
  const repo = { find: findFn } as unknown as Repository<RaceResult>;
  const serializer = {
    serialize: serializeFn,
  } as unknown as RaceResultSerializerService;
  const vectorStore = { upsert: upsertFn } as unknown as VectorStoreService;
  const service = new EmbedService(client, repo, serializer, vectorStore);
  return { service, createFn, findFn, serializeFn, upsertFn };
};

describe('EmbedService', () => {
  describe('embed', () => {
    it('calls embeddings.create with the text and correct model', async () => {
      const { service, createFn } = setup();

      await service.embed('hello world');

      expect(createFn).toHaveBeenCalledTimes(1);
      expect(createFn).toHaveBeenCalledWith({
        input: 'hello world',
        model: EMBEDDING_MODEL,
      });
    });

    it('returns the embedding array from the response', async () => {
      const vector = [0.1, 0.2, 0.3, 0.4];
      const { service } = setup({ embedding: vector });

      const result = await service.embed('some text');

      expect(result).toEqual(vector);
    });

    it('propagates errors from the client without wrapping', async () => {
      const error = new Error('API rate limit exceeded');
      const { service } = setup({ embedError: error });

      await expect(service.embed('text')).rejects.toBe(error);
    });
  });

  describe('batchEmbedRace', () => {
    const makeResult = (
      id: string,
      raceId = 'race-1',
    ): Partial<RaceResult> => ({
      id,
      raceId,
      athleteId: `athlete-${id}`,
      race: { name: 'OCR Champ', date: '2026-05-10' } as RaceResult['race'],
      athlete: {
        firstName: 'Jane',
        lastName: 'Smith',
      } as RaceResult['athlete'],
      splits: [],
    });

    it('serializes and embeds each result, then upserts all points in one call', async () => {
      const { service, findFn, serializeFn, createFn, upsertFn } = setup({
        results: [makeResult('rr-1'), makeResult('rr-2')],
        serialized: 'text chunk',
        embedding: [0.1, 0.2],
      });

      await service.batchEmbedRace('race-1');

      expect(findFn).toHaveBeenCalledWith({
        where: { raceId: 'race-1' },
        relations: { race: true, athlete: true, splits: true },
      });
      expect(serializeFn).toHaveBeenCalledTimes(2);
      expect(createFn).toHaveBeenCalledTimes(2);
      expect(upsertFn).toHaveBeenCalledTimes(1);

      const [points] = upsertFn.mock.calls[0] as [unknown[]];
      expect(points).toHaveLength(2);
      expect(points[0]).toMatchObject({
        id: 'rr-1',
        vector: [0.1, 0.2],
        payload: {
          raceResultId: 'rr-1',
          raceId: 'race-1',
          athleteId: 'athlete-rr-1',
          athleteName: 'Jane Smith',
          raceName: 'OCR Champ',
          raceDate: '2026-05-10',
        },
      });
    });

    it('returns early without calling upsert when no results exist', async () => {
      const { service, upsertFn } = setup({ results: [] });

      await service.batchEmbedRace('race-empty');

      expect(upsertFn).not.toHaveBeenCalled();
    });

    it('propagates errors from embed without swallowing', async () => {
      const error = new Error('OpenAI down');
      const { service } = setup({
        results: [makeResult('rr-1')],
        embedError: error,
      });

      await expect(service.batchEmbedRace('race-1')).rejects.toBe(error);
    });
  });
});
