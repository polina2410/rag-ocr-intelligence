import { Controller, Get, Query } from '@nestjs/common';
import type { AthleteDto, PaginatedResponse } from '@ocr/types';
import { AthletesService } from './athletes.service';
import { ListAthletesQueryDto } from './dto/list-athletes-query.dto';

@Controller('athletes')
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Get()
  findAll(
    @Query() query: ListAthletesQueryDto,
  ): Promise<PaginatedResponse<AthleteDto>> {
    return this.athletesService.findAll(query.page, query.limit);
  }
}
