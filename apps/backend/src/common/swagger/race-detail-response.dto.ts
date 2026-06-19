import { ApiProperty } from '@nestjs/swagger';
import type { RaceDetailDto } from '@ocr/types';
import { RaceResultResponseDto } from './race-result-response.dto';
import { EMBED_STATUSES, RACE_TYPES } from '../constants.js';

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

  @ApiProperty({ enum: EMBED_STATUSES })
  embeddingStatus!: 'pending' | 'complete' | 'failed';

  @ApiProperty({ type: () => [RaceResultResponseDto] })
  results!: RaceResultResponseDto[];
}
