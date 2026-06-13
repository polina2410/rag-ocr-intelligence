import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Athlete } from '../entities/athlete.entity';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import { CsvMetadataParserService } from './csv-metadata-parser.service';
import { CsvRowsParserService } from './csv-rows-parser.service';

@Injectable()
export class IngestionService {
  constructor(
    private readonly metadataParser: CsvMetadataParserService,
    private readonly rowsParser: CsvRowsParserService,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(Athlete)
    private readonly athleteRepo: Repository<Athlete>,
    private readonly dataSource: DataSource,
  ) {}

  async ingestCsv(
    fileBuffer: Buffer,
  ): Promise<{ raceId: string; rowsIngested: number }> {
    const csv = fileBuffer.toString('utf-8');
    const metadata = this.metadataParser.parseMetadata(csv);
    const rows = this.rowsParser.parseRows(csv, metadata);

    const raceId = await this.dataSource.transaction(async (manager) => {
      const race = manager.create(Race, {
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

    return { raceId, rowsIngested: rows.length };
  }
}
