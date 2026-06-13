import type { QdrantClient } from '@qdrant/js-client-rest';
import { RACE_RESULTS_COLLECTION } from './vector-store.constants';
import { type QdrantPoint, VectorStoreService } from './vector-store.service';

const upsertMock = jest.fn();
const mockClient = {
  upsert: upsertMock,
} as unknown as QdrantClient;

const makePoint = (id: string): QdrantPoint => ({
  id,
  vector: Array.from({ length: 3 }, (_, i) => i * 0.1),
  payload: { raceId: 'race-1', athleteId: id },
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
