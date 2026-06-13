import { BadRequestException } from '@nestjs/common';
import type { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';

const ingestCsvMock = jest.fn();
const mockIngestionService = {
  ingestCsv: ingestCsvMock,
} as unknown as IngestionService;

describe('IngestionController', () => {
  let controller: IngestionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new IngestionController(mockIngestionService);
  });

  describe('ingestCsv', () => {
    it('throws BadRequestException when file is undefined', async () => {
      await expect(
        controller.ingestCsv(undefined as unknown as Express.Multer.File),
      ).rejects.toThrow(BadRequestException);
    });

    it('includes a descriptive message when file is missing', async () => {
      await expect(
        controller.ingestCsv(undefined as unknown as Express.Multer.File),
      ).rejects.toMatchObject({
        message: 'CSV file is required (field name: "file")',
      });
    });

    it('returns service result when file is provided', async () => {
      const file = { buffer: Buffer.from('csv data') } as Express.Multer.File;
      ingestCsvMock.mockResolvedValue({ raceId: 'abc-123', rowsIngested: 5 });

      const result = await controller.ingestCsv(file);

      expect(result).toEqual({ raceId: 'abc-123', rowsIngested: 5 });
      expect(ingestCsvMock).toHaveBeenCalledWith(file.buffer);
    });
  });
});
