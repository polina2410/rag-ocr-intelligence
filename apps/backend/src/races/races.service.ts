import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PaginatedResponse, RaceDetailDto, RaceDto } from '@ocr/types';
import { DataSource, In, Repository } from 'typeorm';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
    @InjectRepository(RaceResult)
    private readonly raceResultRepo: Repository<RaceResult>,
    @InjectRepository(ObstacleSplit)
    private readonly obstacleSplitRepo: Repository<ObstacleSplit>,
    private readonly dataSource: DataSource,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<RaceDto>> {
    const skip = (page - 1) * limit;
    const [rows, total] = await this.raceRepo.findAndCount({
      order: { date: 'DESC' },
      skip,
      take: limit,
    });

    const data: RaceDto[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      location: row.location,
      distanceKm: Number(row.distanceKm),
      totalObstacles: row.totalObstacles,
      raceType: row.raceType,
      embeddingStatus: row.embeddingStatus,
    }));

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<RaceDetailDto> {
    const race = await this.raceRepo.findOne({
      where: { id },
      relations: ['results', 'results.athlete', 'results.splits'],
    });

    if (!race) {
      throw new NotFoundException(`Race ${id} not found`);
    }

    const sortedResults = [...race.results].sort((a, b) => {
      if (a.overallPosition === null && b.overallPosition === null) return 0;
      if (a.overallPosition === null) return 1;
      if (b.overallPosition === null) return -1;
      return a.overallPosition - b.overallPosition;
    });

    return {
      id: race.id,
      name: race.name,
      date: race.date,
      location: race.location,
      distanceKm: Number(race.distanceKm),
      totalObstacles: race.totalObstacles,
      raceType: race.raceType,
      results: sortedResults.map((result) => ({
        id: result.id,
        athlete: {
          id: result.athlete.id,
          firstName: result.athlete.firstName,
          lastName: result.athlete.lastName,
          nationality: result.athlete.nationality,
          category: result.athlete.category,
        },
        overallPosition: result.overallPosition,
        finishTimeSeconds: result.finishTimeSeconds,
        status: result.status,
        categoryPosition: result.categoryPosition,
        genderPosition: result.genderPosition,
        splits: [...result.splits]
          .sort((a, b) => a.obstacleNumber - b.obstacleNumber)
          .map((split) => ({
            obstacleNumber: split.obstacleNumber,
            obstacleName: split.obstacleName,
            splitTimeSeconds: split.splitTimeSeconds,
            penaltyCount: split.penaltyCount,
          })),
      })),
    };
  }

  async remove(id: string): Promise<void> {
    const race = await this.raceRepo.findOne({ where: { id } });
    if (!race) {
      throw new NotFoundException(`Race ${id} not found`);
    }

    await this.dataSource.transaction(async (manager) => {
      const results = await manager
        .getRepository(RaceResult)
        .find({ where: { raceId: id }, select: ['id'] });

      if (results.length > 0) {
        const ids = results.map((r) => r.id);
        await manager
          .getRepository(ObstacleSplit)
          .delete({ raceResultId: In(ids) });
      }

      await manager.getRepository(RaceResult).delete({ raceId: id });
      await manager.getRepository(Race).delete(id);
    });

    try {
      await this.vectorStoreService.deleteByRaceId(id);
    } catch (err) {
      this.logger.error(`Failed to delete Qdrant vectors for race ${id}`, err);
    }
  }
}
