import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResponse } from '@ocr/types';
import { RaceResponseDto } from './race-response.dto';

export class PaginatedRacesResponseDto implements PaginatedResponse<RaceResponseDto> {
  @ApiProperty({ type: () => [RaceResponseDto] })
  data!: RaceResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
