import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  AthleteDetailDto,
  AthleteDto,
  PaginatedResponse,
} from '@ocr/types';
import { Repository } from 'typeorm';
import { Athlete } from '../entities/athlete.entity';

@Injectable()
export class AthletesService {
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepo: Repository<Athlete>,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<PaginatedResponse<AthleteDto>> {
    const skip = (page - 1) * limit;
    const [rows, total] = await this.athleteRepo.findAndCount({
      order: { lastName: 'ASC', firstName: 'ASC' },
      skip,
      take: limit,
    });

    const data: AthleteDto[] = rows.map((row) => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      nationality: row.nationality,
      category: row.category,
    }));

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<AthleteDetailDto> {
    const athlete = await this.athleteRepo.findOne({
      where: { id },
      relations: ['results', 'results.race', 'results.splits'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete ${id} not found`);
    }

    const sortedResults = [...athlete.results].sort((a, b) =>
      b.race.date.localeCompare(a.race.date),
    );

    return {
      id: athlete.id,
      firstName: athlete.firstName,
      lastName: athlete.lastName,
      nationality: athlete.nationality,
      category: athlete.category,
      results: sortedResults.map((result) => ({
        id: result.id,
        race: {
          id: result.race.id,
          name: result.race.name,
          date: result.race.date,
          location: result.race.location,
          distanceKm: Number(result.race.distanceKm),
          totalObstacles: result.race.totalObstacles,
          raceType: result.race.raceType,
          embeddingStatus: result.race.embeddingStatus,
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
