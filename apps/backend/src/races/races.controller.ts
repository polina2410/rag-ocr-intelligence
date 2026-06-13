import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { PaginatedResponse, RaceDetailDto, RaceDto } from '@ocr/types';
import { PaginatedRacesResponseDto } from '../common/swagger/paginated-races-response.dto';
import { RaceDetailResponseDto } from '../common/swagger/race-detail-response.dto';
import { ListRacesQueryDto } from './dto/list-races-query.dto';
import { RacesService } from './races.service';

@ApiTags('races')
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  @ApiOperation({ summary: 'List all races (paginated)' })
  @ApiOkResponse({ type: PaginatedRacesResponseDto })
  findAll(
    @Query() query: ListRacesQueryDto,
  ): Promise<PaginatedResponse<RaceDto>> {
    return this.racesService.findAll(query.page, query.limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a race with full results and splits' })
  @ApiParam({ name: 'id', description: 'Race UUID', format: 'uuid' })
  @ApiOkResponse({ type: RaceDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Race not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<RaceDetailDto> {
    return this.racesService.findOne(id);
  }
}
