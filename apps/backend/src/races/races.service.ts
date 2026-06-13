import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { PaginatedResponse, RaceDto } from '@ocr/types';
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
}
