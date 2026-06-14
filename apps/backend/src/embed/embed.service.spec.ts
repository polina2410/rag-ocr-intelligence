import type OpenAI from 'openai';
import type { Repository } from 'typeorm';
import type { RaceResult } from '../entities/race-result.entity.js';
import type { RaceResultSerializerService } from '../serializer/race-result-serializer.service.js';
import type { VectorStoreService } from '../vector-store/vector-store.service.js';
import { EMBEDDING_MODEL } from './embed.constants.js';
import { EmbedService } from './embed.service.js';

const makeClient = (embedding: number[] = [0.1, 0.2, 0.3]) =>
  ({
    embeddings: {
      create: jest.fn().mockResolvedValue({ data: [{ embedding }] }),
    },
  }) as unknown as OpenAI;

const makeRepo = (results: Partial<RaceResult>[] = []) =>
  ({ find: jest.fn().mockResolvedValue(results) }) as unknown as Repository<RaceResult>;

const makeSerializer = (text = 'chunk') =>
  ({ serialize: jest.fn().mockReturnValue(text) }) as unknown as RaceResultSerializerService;

const makeVectorStore = () =>
  ({ upsert: jest.fn().mockResolvedValue(undefined) }) as unknown as VectorStoreService;

const makeService = (
  client = makeClient(),
  repo = makeRepo(),
  serializer = makeSerializer(),
  vectorStore = makeVectorStore(),
) => new EmbedService(client, repo, serializer, vectorStore);

describe('EmbedService', () => {
  describe('embed', () => {
    it('calls embeddings.create with the text and correct model', async () => {
      const client = makeClient();
      const service = makeService(client);

      await service.embed('hello world');

      expect(client.embeddings.create).toHaveBeenCalledTimes(1);
      expect(client.embeddings.create).toHaveBeenCalledWith({
        input: 'hello world',
        model: EMBEDDING_MODEL,
      });
    });

    it('returns the embedding array from the response', async () => {
      const vector = [0.1, 0.2, 0.3, 0.4];
      const service = makeService(makeClient(vector));

      const result = await service.embed('some text');

      expect(result).toEqual(vector);
    });

    it('propagates errors from the client without wrapping', async () => {
      const error = new Error('API rate limit exceeded');
      const client = {
        embeddings: { create: jest.fn().mockRejectedValue(error) },
      } as unknown as OpenAI;
      const service = makeService(client);

      await expect(service.embed('text')).rejects.toBe(error);
    });
  });

  describe('batchEmbedRace', () => {
    const makeResult = (id: string, raceId = 'race-1'): Partial<RaceResult> => ({
      id,
      raceId,
      athleteId: `athlete-${id}`,
      race: { name: 'OCR Champ', date: '2026-05-10' } as RaceResult['race'],
      athlete: { firstName: 'Jane', lastName: 'Smith' } as RaceResult['athlete'],
      splits: [],
    });

    it('serializes and embeds each result, then upserts all points in one call', async () => {
      const results = [makeResult('rr-1'), makeResult('rr-2')];
      const repo = makeRepo(results as RaceResult[]);
      const serializer = makeSerializer('text chunk');
      const vectorStore = makeVectorStore();
      const client = makeClient([0.1, 0.2]);
      const service = makeService(client, repo, serializer, vectorStore);

      await service.batchEmbedRace('race-1');

      expect(repo.find).toHaveBeenCalledWith({
        where: { raceId: 'race-1' },
        relations: { race: true, athlete: true, splits: true },
      });
      expect(serializer.serialize).toHaveBeenCalledTimes(2);
      expect(client.embeddings.create).toHaveBeenCalledTimes(2);
      expect(vectorStore.upsert).toHaveBeenCalledTimes(1);

      const [points] = (vectorStore.upsert as jest.Mock).mock.calls[0] as [unknown[]];
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
      const repo = makeRepo([]);
      const vectorStore = makeVectorStore();
      const service = makeService(makeClient(), repo, makeSerializer(), vectorStore);

      await service.batchEmbedRace('race-empty');

      expect(vectorStore.upsert).not.toHaveBeenCalled();
    });

    it('propagates errors from embed without swallowing', async () => {
      const error = new Error('OpenAI down');
      const client = {
        embeddings: { create: jest.fn().mockRejectedValue(error) },
      } as unknown as OpenAI;
      const repo = makeRepo([makeResult('rr-1')] as RaceResult[]);
      const service = makeService(client, repo);

      await expect(service.batchEmbedRace('race-1')).rejects.toBe(error);
    });
  });
});