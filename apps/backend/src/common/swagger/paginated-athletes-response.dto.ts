import { ApiProperty } from '@nestjs/swagger';
import type { PaginatedResponse } from '@ocr/types';
import { AthleteResponseDto } from './athlete-response.dto';

export class PaginatedAthletesResponseDto implements PaginatedResponse<AthleteResponseDto> {
  @ApiProperty({ type: () => [AthleteResponseDto] })
  data!: AthleteResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;
}
