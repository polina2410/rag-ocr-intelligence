import { ApiProperty } from '@nestjs/swagger';
import type { AthleteResultDto } from '@ocr/types';
import { ObstacleSplitResponseDto } from './obstacle-split-response.dto';
import { RaceResponseDto } from './race-response.dto';
import { RESULT_STATUSES } from '../constants.js';

export class AthleteResultResponseDto implements AthleteResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: () => RaceResponseDto })
  race!: RaceResponseDto;

  @ApiProperty({ type: Number, nullable: true })
  overallPosition!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  finishTimeSeconds!: number | null;

  @ApiProperty({ enum: RESULT_STATUSES })
  status!: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ';

  @ApiProperty({ type: Number, nullable: true })
  categoryPosition!: number | null;

  @ApiProperty({ type: Number, nullable: true })
  genderPosition!: number | null;

  @ApiProperty({ type: () => [ObstacleSplitResponseDto] })
  splits!: ObstacleSplitResponseDto[];
}
