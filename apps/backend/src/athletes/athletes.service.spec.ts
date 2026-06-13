import { NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { Athlete } from '../entities/athlete.entity';
import type { ObstacleSplit } from '../entities/obstacle-split.entity';
import type { Race } from '../entities/race.entity';
import type { RaceResult } from '../entities/race-result.entity';
import { AthletesService } from './athletes.service';

const findAndCountMock = jest.fn();
const findOneMock = jest.fn();
const mockAthleteRepo = {
  findAndCount: findAndCountMock,
  findOne: findOneMock,
} as unknown as Repository<Athlete>;

const makeAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  id: 'uuid-1',
  firstName: 'Ana',
  lastName: 'Ilic',
  nationality: 'RS',
  category: 'Elite',
  results: [],
  ...overrides,
});

const makeRace = (overrides: Partial<Race> = {}): Race => ({
  id: 'race-1',
  name: 'Test Race',
  date: '2024-05-01',
  location: 'Novi Sad',
  distanceKm: '5.00' as unknown as number,
  totalObstacles: 10,
  raceType: 'Sprint',
  results: [],
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
  raceId: 'race-1',
  race: makeRace(),
  athleteId: 'uuid-1',
  athlete: {} as Athlete,
  overallPosition: 1,
  finishTimeSeconds: 3600,
  status: 'FINISHED',
  categoryPosition: 1,
  genderPosition: 1,
  splits: [makeSplit()],
  ...overrides,
});

describe('AthletesService', () => {
  let service: AthletesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AthletesService(mockAthleteRepo);
  });

  describe('findAll', () => {
    it('returns paginated envelope with mapped rows', async () => {
      const rows = [
        makeAthlete({ id: 'a', lastName: 'Ilic' }),
        makeAthlete({ id: 'b', lastName: 'Markovic' }),
        makeAthlete({ id: 'c', lastName: 'Novak' }),
      ];
      findAndCountMock.mockResolvedValue([rows, 3]);

      const result = await service.findAll(1, 20);

      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.data).toHaveLength(3);
    });

    it('maps all AthleteDto fields correctly', async () => {
      const rows = [
        makeAthlete({
          id: 'uuid-1',
          firstName: 'Ana',
          lastName: 'Ilic',
          nationality: 'RS',
          category: 'Elite',
        }),
      ];
      findAndCountMock.mockResolvedValue([rows, 1]);

      const result = await service.findAll(1, 20);

      expect(result.data[0]).toEqual({
        id: 'uuid-1',
        firstName: 'Ana',
        lastName: 'Ilic',
        nationality: 'RS',
        category: 'Elite',
      });
    });

    it('passes correct skip, take, and order to repository', async () => {
      findAndCountMock.mockResolvedValue([[], 0]);

      await service.findAll(3, 10);

      expect(findAndCountMock).toHaveBeenCalledWith({
        order: { lastName: 'ASC', firstName: 'ASC' },
        skip: 20,
        take: 10,
      });
    });

    it('returns empty data and zero total when no athletes exist', async () => {
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
    it('returns mapped AthleteDetailDto with results, race, and splits', async () => {
      const split = makeSplit({ obstacleNumber: 1, obstacleName: 'Wall' });
      const result = makeResult({ id: 'result-1', splits: [split] });
      const athlete = makeAthlete({ id: 'uuid-1', results: [result] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(detail.id).toBe('uuid-1');
      expect(detail.firstName).toBe('Ana');
      expect(detail.results).toHaveLength(1);
      expect(detail.results[0].id).toBe('result-1');
      expect(detail.results[0].race.name).toBe('Test Race');
      expect(detail.results[0].splits).toHaveLength(1);
      expect(detail.results[0].splits[0].obstacleName).toBe('Wall');
    });

    it('coerces distanceKm from string to number on embedded race', async () => {
      const race = makeRace({ distanceKm: '12.50' as unknown as number });
      const result = makeResult({ race, splits: [] });
      const athlete = makeAthlete({ results: [result] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(typeof detail.results[0].race.distanceKm).toBe('number');
      expect(detail.results[0].race.distanceKm).toBe(12.5);
    });

    it('returns results: [] when athlete has no results', async () => {
      const athlete = makeAthlete({ results: [] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(detail.results).toEqual([]);
    });

    it('returns splits: [] when a result has no splits', async () => {
      const result = makeResult({ splits: [] });
      const athlete = makeAthlete({ results: [result] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(detail.results[0].splits).toEqual([]);
    });

    it('passes nullable result fields through as null', async () => {
      const result = makeResult({
        overallPosition: null,
        finishTimeSeconds: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [],
      });
      const athlete = makeAthlete({ results: [result] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(detail.results[0].overallPosition).toBeNull();
      expect(detail.results[0].finishTimeSeconds).toBeNull();
      expect(detail.results[0].categoryPosition).toBeNull();
      expect(detail.results[0].genderPosition).toBeNull();
    });

    it('orders results by race date descending', async () => {
      const r1 = makeResult({
        id: 'r1',
        race: makeRace({ date: '2024-03-01' }),
        splits: [],
      });
      const r2 = makeResult({
        id: 'r2',
        race: makeRace({ date: '2024-07-15' }),
        splits: [],
      });
      const r3 = makeResult({
        id: 'r3',
        race: makeRace({ date: '2024-05-10' }),
        splits: [],
      });
      const athlete = makeAthlete({ results: [r1, r2, r3] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(detail.results.map((r) => r.id)).toEqual(['r2', 'r3', 'r1']);
    });

    it('orders splits by obstacleNumber ascending', async () => {
      const s1 = makeSplit({ id: 's1', obstacleNumber: 3 });
      const s2 = makeSplit({ id: 's2', obstacleNumber: 1 });
      const result = makeResult({ splits: [s1, s2] });
      const athlete = makeAthlete({ results: [result] });
      findOneMock.mockResolvedValue(athlete);

      const detail = await service.findOne('uuid-1');

      expect(detail.results[0].splits.map((s) => s.obstacleNumber)).toEqual([
        1, 3,
      ]);
    });

    it('throws NotFoundException when athlete does not exist', async () => {
      findOneMock.mockResolvedValue(null);

      await expect(service.findOne('no-such-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
