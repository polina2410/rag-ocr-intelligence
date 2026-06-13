import {
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { DataSource, Repository } from 'typeorm';
import type { Athlete } from '../entities/athlete.entity';
import type { Race } from '../entities/race.entity';
import type { CsvMetadataParserService } from './csv-metadata-parser.service';
import type { CsvRowsParserService } from './csv-rows-parser.service';
import { IngestionService } from './ingestion.service';

const mockMetadataParser = {
  parseMetadata: jest.fn(),
} as unknown as CsvMetadataParserService;

const mockRowsParser = {
  parseRows: jest.fn(),
} as unknown as CsvRowsParserService;

const mockRaceRepo = {} as Repository<Race>;

const mockAthleteRepo = {
  findOneBy: jest.fn(),
} as unknown as Repository<Athlete>;

const mockDataSource = {
  transaction: jest.fn(),
} as unknown as DataSource;

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IngestionService(
      mockMetadataParser,
      mockRowsParser,
      mockRaceRepo,
      mockAthleteRepo,
      mockDataSource,
    );
  });

  describe('ingestCsv', () => {
    const buffer = Buffer.from('csv content');

    it('throws UnprocessableEntityException when metadata parser throws', async () => {
      (mockMetadataParser.parseMetadata as jest.Mock).mockImplementation(() => {
        throw new Error('CSV metadata missing required field: "Race"');
      });

      await expect(service.ingestCsv(buffer)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('surfaces the parser error message in the 422 response', async () => {
      const parserMessage = 'CSV metadata missing required field: "Race"';
      (mockMetadataParser.parseMetadata as jest.Mock).mockImplementation(() => {
        throw new Error(parserMessage);
      });

      await expect(service.ingestCsv(buffer)).rejects.toMatchObject({
        message: parserMessage,
      });
    });

    it('throws UnprocessableEntityException when rows parser throws', async () => {
      (mockMetadataParser.parseMetadata as jest.Mock).mockReturnValue({});
      (mockRowsParser.parseRows as jest.Mock).mockImplementation(() => {
        throw new Error('CSV missing expected column: "first_name"');
      });

      await expect(service.ingestCsv(buffer)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('throws InternalServerErrorException when transaction rejects', async () => {
      (mockMetadataParser.parseMetadata as jest.Mock).mockReturnValue({});
      (mockRowsParser.parseRows as jest.Mock).mockReturnValue([]);
      (mockDataSource.transaction as jest.Mock).mockRejectedValue(
        new Error('DB connection lost'),
      );

      await expect(service.ingestCsv(buffer)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('does not expose DB error details in the InternalServerErrorException message', async () => {
      (mockMetadataParser.parseMetadata as jest.Mock).mockReturnValue({});
      (mockRowsParser.parseRows as jest.Mock).mockReturnValue([]);
      (mockDataSource.transaction as jest.Mock).mockRejectedValue(
        new Error('violates foreign key constraint "fk_race_id"'),
      );

      await expect(service.ingestCsv(buffer)).rejects.toMatchObject({
        message: 'Failed to save race data',
      });
    });

    it('returns raceId and rowsIngested on success', async () => {
      (mockMetadataParser.parseMetadata as jest.Mock).mockReturnValue({});
      (mockRowsParser.parseRows as jest.Mock).mockReturnValue([{}, {}]);
      (mockDataSource.transaction as jest.Mock).mockResolvedValue('race-uuid-123');

      const result = await service.ingestCsv(buffer);

      expect(result).toEqual({ raceId: 'race-uuid-123', rowsIngested: 2 });
    });
  });
});