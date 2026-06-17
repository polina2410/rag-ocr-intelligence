import type { QdrantClient, Schemas } from '@qdrant/js-client-rest';
import { RACE_RESULTS_COLLECTION } from './vector-store.constants';
import { type QdrantPoint, VectorStoreService } from './vector-store.service';

const upsertMock = jest.fn();
const searchMock = jest.fn();
const deleteMock = jest.fn();
const mockClient = {
  upsert: upsertMock,
  search: searchMock,
  delete: deleteMock,
} as unknown as QdrantClient;

const makePoint = (id: string): QdrantPoint => ({
  id,
  vector: Array.from({ length: 3 }, (_, i) => i * 0.1),
  payload: { raceId: 'race-1', athleteId: id },
});

const makeScoredPoint = (
  id: Schemas['ExtendedPointId'],
  score: number,
  payload?: Record<string, unknown> | null,
): Schemas['ScoredPoint'] => ({
  id,
  version: 1,
  score,
  payload,
});

describe('VectorStoreService.upsert', () => {
  let service: VectorStoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VectorStoreService(mockClient);
  });

  it('calls client.upsert with correct collection name, wait flag, and mapped points', async () => {
    upsertMock.mockResolvedValue({ status: 'completed', operation_id: 1 });
    const points = [makePoint('id-1'), makePoint('id-2')];

    await service.upsert(points);

    expect(upsertMock).toHaveBeenCalledTimes(1);
    expect(upsertMock).toHaveBeenCalledWith(RACE_RESULTS_COLLECTION, {
      wait: true,
      points: [
        { id: 'id-1', vector: points[0].vector, payload: points[0].payload },
        { id: 'id-2', vector: points[1].vector, payload: points[1].payload },
      ],
    });
  });

  it('does not call client.upsert when points array is empty', async () => {
    await service.upsert([]);

    expect(upsertMock).not.toHaveBeenCalled();
  });

  it('propagates errors thrown by the client', async () => {
    const error = new Error('Qdrant unavailable');
    upsertMock.mockRejectedValue(error);

    await expect(service.upsert([makePoint('id-1')])).rejects.toThrow(
      'Qdrant unavailable',
    );
  });
});

describe('VectorStoreService.query', () => {
  let service: VectorStoreService;
  const queryVector = [0.1, 0.2, 0.3];
  const topK = 5;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VectorStoreService(mockClient);
  });

  it('calls client.search with correct args and returns mapped results', async () => {
    searchMock.mockResolvedValue([
      makeScoredPoint('uuid-a', 0.95, { raceId: 'r1' }),
      makeScoredPoint('uuid-b', 0.87, { raceId: 'r2' }),
    ]);

    const results = await service.query(queryVector, topK);

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(searchMock).toHaveBeenCalledWith(RACE_RESULTS_COLLECTION, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
    });
    expect(results).toEqual([
      { id: 'uuid-a', score: 0.95, payload: { raceId: 'r1' } },
      { id: 'uuid-b', score: 0.87, payload: { raceId: 'r2' } },
    ]);
  });

  it('returns empty array when client returns no hits', async () => {
    searchMock.mockResolvedValue([]);

    const results = await service.query(queryVector, topK);

    expect(searchMock).toHaveBeenCalledTimes(1);
    expect(results).toEqual([]);
  });

  it('maps null payload to empty object', async () => {
    searchMock.mockResolvedValue([makeScoredPoint('uuid-c', 0.5, null)]);

    const results = await service.query(queryVector, topK);

    expect(results[0].payload).toEqual({});
  });

  it('coerces numeric id to string', async () => {
    searchMock.mockResolvedValue([makeScoredPoint(42, 0.9, {})]);

    const results = await service.query(queryVector, topK);

    expect(results[0].id).toBe('42');
  });

  it('propagates errors thrown by the client', async () => {
    const error = new Error('search failed');
    searchMock.mockRejectedValue(error);

    await expect(service.query(queryVector, topK)).rejects.toThrow(
      'search failed',
    );
  });
});

describe('VectorStoreService.deleteByRaceId', () => {
  let service: VectorStoreService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VectorStoreService(mockClient);
  });

  it('calls client.delete with the correct collection and raceId filter', async () => {
    deleteMock.mockResolvedValue({ status: 'acknowledged', operation_id: 1 });

    await service.deleteByRaceId('race-abc');

    expect(deleteMock).toHaveBeenCalledTimes(1);
    expect(deleteMock).toHaveBeenCalledWith(RACE_RESULTS_COLLECTION, {
      filter: {
        must: [{ key: 'raceId', match: { value: 'race-abc' } }],
      },
    });
  });

  it('propagates errors thrown by the client', async () => {
    const error = new Error('Qdrant unavailable');
    deleteMock.mockRejectedValue(error);

    await expect(service.deleteByRaceId('race-abc')).rejects.toThrow(
      'Qdrant unavailable',
    );
  });

  it('logs a debug message on success', async () => {
    deleteMock.mockResolvedValue({ status: 'acknowledged', operation_id: 2 });
    const debugSpy = jest
      .spyOn(service['logger'], 'debug')
      .mockImplementation(() => undefined);

    await service.deleteByRaceId('race-xyz');

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(debugSpy.mock.calls[0][0]).toContain('race-xyz');
  });
});
