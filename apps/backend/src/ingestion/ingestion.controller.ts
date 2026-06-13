import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CSV_MULTER_OPTIONS } from './csv-upload.config';
import { IngestCsvResponseDto } from './dto/ingest-csv-response.dto';
import { IngestionService } from './ingestion.service';
import { MulterExceptionFilter } from './multer-exception.filter';

@ApiTags('ingest')
@Controller('ingest')
@UseFilters(MulterExceptionFilter)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('csv')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', CSV_MULTER_OPTIONS))
  @ApiOperation({ summary: 'Ingest a race CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Race results CSV file',
        },
      },
    },
  })
  @ApiCreatedResponse({ type: IngestCsvResponseDto })
  @ApiBadRequestResponse({ description: 'Missing or invalid CSV file' })
  async ingestCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ raceId: string; rowsIngested: number }> {
    if (!file) {
      throw new BadRequestException(
        'CSV file is required (field name: "file")',
      );
    }
    return this.ingestionService.ingestCsv(file.buffer);
  }
}
