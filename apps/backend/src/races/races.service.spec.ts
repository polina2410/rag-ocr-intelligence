import { NotFoundException } from '@nestjs/common';
import { In } from 'typeorm';
import type { DataSource, Repository } from 'typeorm';
import type { Athlete } from '../entities/athlete.entity';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import type { VectorStoreService } from '../vector-store/vector-store.service';
import { RacesService } from './races.service';

const findAndCountMock = jest.fn();
const findOneMock = jest.fn();
const mockRaceRepo = {
  findAndCount: findAndCountMock,
  findOne: findOneMock,
} as unknown as Repository<Race>;

const raceResultFindMock = jest.fn();
const raceResultDeleteMock = jest.fn();
const obstacleSplitDeleteMock = jest.fn();
const raceDeleteMock = jest.fn();

const mockRaceResultRepo = {
  find: raceResultFindMock,
  delete: raceResultDeleteMock,
};
const mockObstacleSplitRepo = { delete: obstacleSplitDeleteMock };
const mockRaceDeleteRepo = { delete: raceDeleteMock };

const mockManager = {
  getRepository: jest.fn((entity: unknown) => {
    if (entity === RaceResult) return mockRaceResultRepo;
    if (entity === ObstacleSplit) return mockObstacleSplitRepo;
    if (entity === Race) return mockRaceDeleteRepo;
    return {};
  }),
};

const transactionMock = jest
  .fn()
  .mockImplementation((cb: (m: typeof mockManager) => Promise<void>) =>
    cb(mockManager),
  );
const mockDataSource = {
  transaction: transactionMock,
} as unknown as DataSource;

const deleteByRaceIdMock = jest.fn();
const mockVectorStore = {
  deleteByRaceId: deleteByRaceIdMock,
} as unknown as VectorStoreService;

const makeRace = (overrides: Partial<Race> = {}): Race => ({
  id: 'uuid-1',
  name: 'Test Race',
  date: '2024-05-01',
  location: 'Novi Sad',
  distanceKm: '5.00' as unknown as number,
  totalObstacles: 10,
  raceType: 'Sprint',
  results: [],
  ...overrides,
});

const makeAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  id: 'athlete-1',
  firstName: 'Ana',
  lastName: 'Ilic',
  nationality: 'RS',
  category: 'Elite',
  ...overrides,
});

const makeSplit = (overrides: Partial<ObstacleSplit> = {}): ObstacleSplit => ({
  id: 'split-1',
  raceResultId: 'result-1',
  raceResult: {} as RaceResult,
  obstacleNumber: 1,
  obstacleName: 'Wall',
  splitTimeSeconds: 30,
  penaltyCount: 0,
  ...overrides,
});

const makeResult = (overrides: Partial<RaceResult> = {}): RaceResult => ({
  id: 'result-1',
  raceId: 'uuid-1',
  race: {} as Race,
  athleteId: 'athlete-1',
  athlete: makeAthlete(),
  overallPosition: 1,
  finishTimeSeconds: 3600,
  status: 'FINISHED',
  categoryPosition: 1,
  genderPosition: 1,
  splits: [makeSplit()],
  ...overrides,
});

describe('RacesService', () => {
  let service: RacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RacesService(
      mockRaceRepo,
      {} as never,
      {} as never,
      mockDataSource,
      mockVectorStore,
    );
  });

  describe('findAll', () => {
    it('returns paginated envelope with mapped rows', async () => {
      const rows = [
        makeRace({ id: 'a', distanceKm: '5.00' as unknown as number }),
        makeRace({ id: 'b', distanceKm: '10.50' as unknown as number }),
        makeRace({ id: 'c', distanceKm: '3.75' as unknown as number }),
      ];
      findAndCountMock.mockResolvedValue([rows, 3]);

      const result = await service.findAll(1, 20);

      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.data).toHaveLength(3);
    });

    it('coerces distanceKm from string to number', async () => {
      const rows = [makeRace({ distanceKm: '5.75' as unknown as number })];
      findAndCountMock.mockResolvedValue([rows, 1]);

      const result = await service.findAll(1, 20);

      expect(typeof result.data[0].distanceKm).toBe('number');
      expect(result.data[0].distanceKm).toBe(5.75);
    });

    it('passes correct skip and take to repository', async () => {
      findAndCountMock.mockResolvedValue([[], 0]);

      await service.findAll(3, 10);

      expect(findAndCountMock).toHaveBeenCalledWith({
        order: { date: 'DESC' },
        skip: 20,
        take: 10,
      });
    });

    it('returns empty data and zero total when no races exist', async () => {
      findAndCountMock.mockResolvedValue([[], 0]);

      const result = await service.findAll(1, 20);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('returns correct page and limit in envelope when page is beyond last', async () => {
      findAndCountMock.mockResolvedValue([[], 5]);

      const result = await service.findAll(99, 20);

      expect(result.data).toEqual([]);
      expect(result.total).toBe(5);
      expect(result.page).toBe(99);
      expect(result.limit).toBe(20);
    });
  });

  describe('findOne', () => {
    it('returns mapped RaceDetailDto with results, athlete, and splits', async () => {
      const split = makeSplit({
        obstacleNumber: 1,
        obstacleName: 'Wall',
        splitTimeSeconds: 30,
        penaltyCount: 0,
      });
      const result = makeResult({
        id: 'result-1',
        overallPosition: 1,
        splits: [split],
      });
      const race = makeRace({
        id: 'uuid-1',
        distanceKm: '5.00' as unknown as number,
        results: [result],
      });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(detail.id).toBe('uuid-1');
      expect(detail.results).toHaveLength(1);
      expect(detail.results[0].id).toBe('result-1');
      expect(detail.results[0].athlete.firstName).toBe('Ana');
      expect(detail.results[0].splits).toHaveLength(1);
      expect(detail.results[0].splits[0].obstacleName).toBe('Wall');
    });

    it('coerces distanceKm from string to number', async () => {
      const race = makeRace({
        distanceKm: '12.50' as unknown as number,
        results: [],
      });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(typeof detail.distanceKm).toBe('number');
      expect(detail.distanceKm).toBe(12.5);
    });

    it('returns results: [] when race has no results', async () => {
      const race = makeRace({ results: [] });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(detail.results).toEqual([]);
    });

    it('returns splits: [] when a result has no splits', async () => {
      const result = makeResult({ splits: [] });
      const race = makeRace({ results: [result] });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(detail.results[0].splits).toEqual([]);
    });

    it('passes nullable fields through as null', async () => {
      const result = makeResult({
        overallPosition: null,
        finishTimeSeconds: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [],
      });
      const race = makeRace({ results: [result] });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(detail.results[0].overallPosition).toBeNull();
      expect(detail.results[0].finishTimeSeconds).toBeNull();
      expect(detail.results[0].categoryPosition).toBeNull();
      expect(detail.results[0].genderPosition).toBeNull();
    });

    it('orders results by overallPosition ascending, nulls last', async () => {
      const r1 = makeResult({ id: 'r1', overallPosition: 3, splits: [] });
      const r2 = makeResult({ id: 'r2', overallPosition: null, splits: [] });
      const r3 = makeResult({ id: 'r3', overallPosition: 1, splits: [] });
      const race = makeRace({ results: [r1, r2, r3] });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(detail.results.map((r) => r.id)).toEqual(['r3', 'r1', 'r2']);
    });

    it('orders splits by obstacleNumber ascending', async () => {
      const s1 = makeSplit({ id: 's1', obstacleNumber: 3 });
      const s2 = makeSplit({ id: 's2', obstacleNumber: 1 });
      const result = makeResult({ splits: [s1, s2] });
      const race = makeRace({ results: [result] });
      findOneMock.mockResolvedValue(race);

      const detail = await service.findOne('uuid-1');

      expect(detail.results[0].splits.map((s) => s.obstacleNumber)).toEqual([
        1, 3,
      ]);
    });

    it('throws NotFoundException when race does not exist', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(service.findOne('no-such-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('deletes splits, results, and race inside a transaction, then cleans up Qdrant', async () => {
      findOneMock.mockResolvedValue(makeRace());
      raceResultFindMock.mockResolvedValue([{ id: 'result-1' }]);

      await service.remove('uuid-1');

      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(obstacleSplitDeleteMock).toHaveBeenCalledWith({
        raceResultId: In(['result-1']),
      });
      expect(raceResultDeleteMock).toHaveBeenCalledWith({ raceId: 'uuid-1' });
      expect(raceDeleteMock).toHaveBeenCalledWith('uuid-1');
      expect(deleteByRaceIdMock).toHaveBeenCalledWith('uuid-1');
    });

    it('throws NotFoundException when race does not exist', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(service.remove('no-such-uuid')).rejects.toThrow(
        NotFoundException,
      );
      expect(transactionMock).not.toHaveBeenCalled();
      expect(deleteByRaceIdMock).not.toHaveBeenCalled();
    });

    it('still resolves when Qdrant delete fails', async () => {
      findOneMock.mockResolvedValue(makeRace());
      raceResultFindMock.mockResolvedValue([{ id: 'result-1' }]);
      deleteByRaceIdMock.mockRejectedValue(new Error('Qdrant down'));

      await expect(service.remove('uuid-1')).resolves.toBeUndefined();
      expect(raceDeleteMock).toHaveBeenCalled();
    });

    it('skips ObstacleSplit delete when race has no results', async () => {
      findOneMock.mockResolvedValue(makeRace());
      raceResultFindMock.mockResolvedValue([]);

      await service.remove('uuid-1');

      expect(obstacleSplitDeleteMock).not.toHaveBeenCalled();
      expect(raceResultDeleteMock).toHaveBeenCalled();
      expect(raceDeleteMock).toHaveBeenCalled();
    });
  });
});
