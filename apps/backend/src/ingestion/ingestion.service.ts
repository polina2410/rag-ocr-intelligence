import { InjectQueue } from '@nestjs/bullmq';
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ParsedRaceResult, RaceMetadata } from '@ocr/types';
import type { Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import { Athlete } from '../entities/athlete.entity';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import type { EmbedJobData } from '../queue/embed-job.types';
import { EMBED_JOB, EMBED_QUEUE } from '../queue/queue.constants';
import { CsvMetadataParserService } from './csv-metadata-parser.service';
import { CsvRowsParserService } from './csv-rows-parser.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly metadataParser: CsvMetadataParserService,
    private readonly rowsParser: CsvRowsParserService,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(Athlete)
    private readonly athleteRepo: Repository<Athlete>,
    private readonly dataSource: DataSource,
    @InjectQueue(EMBED_QUEUE)
    private readonly embedQueue: Queue<EmbedJobData>,
  ) {}

  async ingestCsv(
    fileBuffer: Buffer,
    originalFileName: string,
  ): Promise<{ raceId: string; rowsIngested: number }> {
    const existing = await this.raceRepo.findOneBy({ originalFileName });
    if (existing) {
      throw new ConflictException(
        `A file named "${originalFileName}" has already been uploaded`,
      );
    }

    const csv = fileBuffer.toString('utf-8');

    let metadata: RaceMetadata;
    let rows: ParsedRaceResult[];
    try {
      metadata = this.metadataParser.parseMetadata(csv);
      rows = this.rowsParser.parseRows(csv, metadata);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to parse CSV';
      throw new UnprocessableEntityException(message);
    }

    const existingByName = await this.raceRepo.findOneBy({ name: metadata.name });
    if (existingByName) {
      throw new ConflictException(
        `A race named "${metadata.name}" has already been uploaded`,
      );
    }

    let raceId: string;
    try {
      raceId = await this.dataSource.transaction(async (manager) => {
        const race = manager.create(Race, {
          originalFileName,
          name: metadata.name,
          date: metadata.date,
          location: metadata.location,
          distanceKm: metadata.distanceKm,
          totalObstacles: metadata.totalObstacles,
          raceType: metadata.raceType,
        });
        const savedRace = await manager.save(Race, race);

        for (const row of rows) {
          let athlete = await this.athleteRepo.findOneBy({
            firstName: row.athlete.firstName,
            lastName: row.athlete.lastName,
            nationality: row.athlete.nationality,
          });
          if (!athlete) {
            athlete = await manager.save(
              Athlete,
              manager.create(Athlete, {
                firstName: row.athlete.firstName,
                lastName: row.athlete.lastName,
                nationality: row.athlete.nationality,
                category: row.athlete.category,
              }),
            );
          }

          const result = await manager.save(
            RaceResult,
            manager.create(RaceResult, {
              raceId: savedRace.id,
              athleteId: athlete.id,
              overallPosition: row.overallPosition,
              finishTimeSeconds: row.finishTimeSeconds,
              status: row.status,
              categoryPosition: row.categoryPosition,
              genderPosition: row.genderPosition,
            }),
          );

          if (row.splits.length > 0) {
            const splits = row.splits.map((s) =>
              manager.create(ObstacleSplit, {
                raceResultId: result.id,
                obstacleNumber: s.obstacleNumber,
                obstacleName: s.obstacleName,
                splitTimeSeconds: s.splitTimeSeconds,
                penaltyCount: s.penaltyCount,
              }),
            );
            await manager.save(ObstacleSplit, splits);
          }
        }

        return savedRace.id;
      });
    } catch (error: unknown) {
      this.logger.error(
        'Failed to save race data',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to save race data');
    }

    await this.embedQueue.add(EMBED_JOB, { raceId });

    return { raceId, rowsIngested: rows.length };
  }
}
