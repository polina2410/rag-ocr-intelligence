import { ApiProperty } from '@nestjs/swagger';
import type { RaceDto } from '@ocr/types';

const RACE_TYPES = ['Sprint', 'Super', 'DEKA', 'Open'] as const;

export class RaceResponseDto implements RaceDto {
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
}
