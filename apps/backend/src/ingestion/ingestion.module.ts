import { Module } from '@nestjs/common';
import { CsvMetadataParserService } from './csv-metadata-parser.service.js';

@Module({
  providers: [CsvMetadataParserService],
  exports: [CsvMetadataParserService],
})
export class IngestionModule {}
