import { ApiProperty } from '@nestjs/swagger';
import type { RaceResultDto } from '@ocr/types';
import { AthleteResponseDto } from './athlete-response.dto';
import { ObstacleSplitResponseDto } from './obstacle-split-response.dto';

const RESULT_STATUSES = ['FINISHED', 'DNF', 'DNS', 'DSQ'] as const;

export class RaceResultResponseDto implements RaceResultDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: () => AthleteResponseDto })
  athlete!: AthleteResponseDto;

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
