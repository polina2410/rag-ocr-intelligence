import { ApiProperty } from '@nestjs/swagger';
import type { RaceDto } from '@ocr/types';
import { EMBED_STATUSES, RACE_TYPES } from '../constants.js';

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

  @ApiProperty({ enum: EMBED_STATUSES })
  embeddingStatus!: 'pending' | 'complete' | 'failed';
}
