import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PaginatedResponse, RaceDetailDto, RaceDto } from '@ocr/types';
import { Repository } from 'typeorm';
import { Race } from '../entities/race.entity';

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
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
}
