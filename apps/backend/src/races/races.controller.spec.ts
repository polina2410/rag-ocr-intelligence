import { NotFoundException } from '@nestjs/common';
import type { RaceDetailDto, RaceDto } from '@ocr/types';
import type { RacesService } from './races.service';
import { RacesController } from './races.controller';

const findAllMock = jest.fn();
const findOneMock = jest.fn();
const removeMock = jest.fn();

const mockService = {
  findAll: findAllMock,
  findOne: findOneMock,
  remove: removeMock,
} as unknown as RacesService;

describe('RacesController', () => {
  let controller: RacesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new RacesController(mockService);
  });

  describe('DELETE /races/:id', () => {
    it('delegates to racesService.remove and returns undefined (204)', async () => {
      removeMock.mockResolvedValue(undefined);

      const result = await controller.remove('uuid-1');

      expect(removeMock).toHaveBeenCalledWith('uuid-1');
      expect(result).toBeUndefined();
    });

    it('propagates NotFoundException thrown by service', async () => {
      removeMock.mockRejectedValue(
        new NotFoundException('Race uuid-x not found'),
      );

      await expect(controller.remove('uuid-x')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('GET /races', () => {
    it('delegates to racesService.findAll with page and limit', async () => {
      const envelope = { data: [] as RaceDto[], total: 0, page: 1, limit: 20 };
      findAllMock.mockResolvedValue(envelope);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(findAllMock).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(envelope);
    });
  });

  describe('GET /races/:id', () => {
    it('delegates to racesService.findOne', async () => {
      const detail = { id: 'uuid-1', results: [] } as unknown as RaceDetailDto;
      findOneMock.mockResolvedValue(detail);

      const result = await controller.findOne('uuid-1');

      expect(findOneMock).toHaveBeenCalledWith('uuid-1');
      expect(result).toEqual(detail);
    });

    it('propagates NotFoundException thrown by service', async () => {
      findOneMock.mockRejectedValue(new NotFoundException('Race not found'));

      await expect(controller.findOne('no-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
