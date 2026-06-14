import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../entities/athlete.entity';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import { QueueModule } from '../queue/queue.module';
import { CsvMetadataParserService } from './csv-metadata-parser.service';
import { CsvRowsParserService } from './csv-rows-parser.service';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit]),
    QueueModule,
  ],
  controllers: [IngestionController],
  providers: [CsvMetadataParserService, CsvRowsParserService, IngestionService],
  exports: [CsvMetadataParserService, CsvRowsParserService],
})
export class IngestionModule {}
