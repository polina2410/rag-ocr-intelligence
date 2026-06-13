import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CSV_MULTER_OPTIONS } from './csv-upload.config';
import { IngestionService } from './ingestion.service';

@Controller('ingest')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('csv')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', CSV_MULTER_OPTIONS))
  async ingestCsv(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ raceId: string; rowsIngested: number }> {
    return this.ingestionService.ingestCsv(file.buffer);
  }
}
