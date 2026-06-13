import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { AthleteDto, PaginatedResponse } from '@ocr/types';
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
}
