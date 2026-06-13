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
import { CSV_MULTER_OPTIONS } from './csv-upload.config';
import { IngestionService } from './ingestion.service';
import { MulterExceptionFilter } from './multer-exception.filter';

@Controller('ingest')
@UseFilters(MulterExceptionFilter)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('csv')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', CSV_MULTER_OPTIONS))
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
