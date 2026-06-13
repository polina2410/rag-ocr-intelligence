import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type {
  AthleteDetailDto,
  AthleteDto,
  PaginatedResponse,
} from '@ocr/types';
import { AthleteDetailResponseDto } from '../common/swagger/athlete-detail-response.dto';
import { PaginatedAthletesResponseDto } from '../common/swagger/paginated-athletes-response.dto';
import { AthletesService } from './athletes.service';
import { ListAthletesQueryDto } from './dto/list-athletes-query.dto';

@ApiTags('athletes')
@Controller('athletes')
export class AthletesController {
  constructor(private readonly athletesService: AthletesService) {}

  @Get()
  @ApiOperation({ summary: 'List all athletes (paginated)' })
  @ApiOkResponse({ type: PaginatedAthletesResponseDto })
  findAll(
    @Query() query: ListAthletesQueryDto,
  ): Promise<PaginatedResponse<AthleteDto>> {
    return this.athletesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an athlete with all race results' })
  @ApiParam({ name: 'id', description: 'Athlete UUID', format: 'uuid' })
  @ApiOkResponse({ type: AthleteDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Athlete not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<AthleteDetailDto> {
    return this.athletesService.findOne(id);
  }
}
