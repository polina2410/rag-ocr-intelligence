import { ApiProperty } from '@nestjs/swagger';
import type { AthleteDto } from '@ocr/types';

export class AthleteResponseDto implements AthleteDto {
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
}
