import type { Repository } from 'typeorm';
import type { Race } from '../entities/race.entity';
import { RacesService } from './races.service';

const findAndCountMock = jest.fn();
const mockRaceRepo = {
  findAndCount: findAndCountMock,
} as unknown as Repository<Race>;

const makeRace = (overrides: Partial<Race> = {}): Race => ({
  id: 'uuid-1',
  name: 'Test Race',
  date: '2024-05-01',
  location: 'Novi Sad',
  distanceKm: '5.00' as unknown as number,
  totalObstacles: 10,
  raceType: 'Sprint',
  ...overrides,
});

describe('RacesService', () => {
  let service: RacesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RacesService(mockRaceRepo);
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
});
