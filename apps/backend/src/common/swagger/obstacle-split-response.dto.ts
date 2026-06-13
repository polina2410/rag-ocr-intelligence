import { ApiProperty } from '@nestjs/swagger';
import type { ObstacleSplitDto } from '@ocr/types';

export class ObstacleSplitResponseDto implements ObstacleSplitDto {
  @ApiProperty()
  obstacleNumber!: number;

  @ApiProperty()
  obstacleName!: string;

  @ApiProperty({ type: Number, nullable: true })
  splitTimeSeconds!: number | null;

  @ApiProperty()
  penaltyCount!: number;
}
