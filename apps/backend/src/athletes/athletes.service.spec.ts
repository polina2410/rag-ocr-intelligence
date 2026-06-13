import type { Repository } from 'typeorm';
import type { Athlete } from '../entities/athlete.entity';
import { AthletesService } from './athletes.service';

const findAndCountMock = jest.fn();
const mockAthleteRepo = {
  findAndCount: findAndCountMock,
} as unknown as Repository<Athlete>;

const makeAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  id: 'uuid-1',
  firstName: 'Ana',
  lastName: 'Ilic',
  nationality: 'RS',
  category: 'Elite',
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
});
