import { ApiProperty } from '@nestjs/swagger';

export class IngestCsvResponseDto {
  @ApiProperty()
  raceId!: string;

  @ApiProperty()
  rowsIngested!: number;
}
