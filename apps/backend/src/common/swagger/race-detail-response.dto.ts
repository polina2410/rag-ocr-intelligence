import { ApiProperty } from '@nestjs/swagger';
import type { RaceDetailDto } from '@ocr/types';
import { RaceResultResponseDto } from './race-result-response.dto';

const RACE_TYPES = ['Sprint', 'Super', 'DEKA', 'Open'] as const;

export class RaceDetailResponseDto implements RaceDetailDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  date!: string;

  @ApiProperty()
  location!: string;

  @ApiProperty()
  distanceKm!: number;

  @ApiProperty()
  totalObstacles!: number;

  @ApiProperty({ enum: RACE_TYPES })
  raceType!: 'Sprint' | 'Super' | 'DEKA' | 'Open';

  @ApiProperty({ type: () => [RaceResultResponseDto] })
  results!: RaceResultResponseDto[];
}
