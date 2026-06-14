import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const MAX_QUERY_LENGTH = 1000;

export class AskQueryDto {
  @ApiProperty({
    description: 'Natural-language question about the race data',
    maxLength: MAX_QUERY_LENGTH,
    example: 'Who had the fastest Rope Climb split at the Spring Sprint?',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(MAX_QUERY_LENGTH)
  query!: string;
}
