import { Controller, Get, Query } from '@nestjs/common';
import type { PaginatedResponse, RaceDto } from '@ocr/types';
import { ListRacesQueryDto } from './dto/list-races-query.dto';
import { RacesService } from './races.service';

@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  findAll(
    @Query() query: ListRacesQueryDto,
  ): Promise<PaginatedResponse<RaceDto>> {
    return this.racesService.findAll(query.page, query.limit);
  }
}
