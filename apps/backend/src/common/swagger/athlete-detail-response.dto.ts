import { ApiProperty } from '@nestjs/swagger';
import type { AthleteDetailDto } from '@ocr/types';
import { AthleteResultResponseDto } from './athlete-result-response.dto';

export class AthleteDetailResponseDto implements AthleteDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  nationality!: string;

  @ApiProperty()
  category!: string;

  @ApiProperty({ type: () => [AthleteResultResponseDto] })
  results!: AthleteResultResponseDto[];
}
