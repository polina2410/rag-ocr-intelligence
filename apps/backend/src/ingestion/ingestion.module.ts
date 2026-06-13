import { Module } from '@nestjs/common';
import { CsvMetadataParserService } from './csv-metadata-parser.service.js';
import { CsvRowsParserService } from './csv-rows-parser.service.js';

@Module({
  providers: [CsvMetadataParserService, CsvRowsParserService],
  exports: [CsvMetadataParserService, CsvRowsParserService],
})
export class IngestionModule {}
