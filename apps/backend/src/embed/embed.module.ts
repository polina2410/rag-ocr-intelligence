import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../entities/race.entity.js';
import { RaceResult } from '../entities/race-result.entity.js';
import { OpenAiModule } from '../openai/openai.module.js';
import { QueueModule } from '../queue/queue.module.js';
import { RaceResultSerializerService } from '../serializer/race-result-serializer.service.js';
import { VectorStoreModule } from '../vector-store/vector-store.module.js';
import { EmbedProcessor } from './embed.processor.js';
import { EmbedService } from './embed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RaceResult, Race]),
    VectorStoreModule,
    OpenAiModule,
    QueueModule,
  ],
  providers: [RaceResultSerializerService, EmbedService, EmbedProcessor],
  exports: [EmbedService],
})
export class EmbedModule {}
