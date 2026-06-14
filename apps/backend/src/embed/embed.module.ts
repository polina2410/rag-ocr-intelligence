import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RaceResult } from '../entities/race-result.entity.js';
import { OpenAiModule } from '../openai/openai.module.js';
import { RaceResultSerializerService } from '../serializer/race-result-serializer.service.js';
import { VectorStoreModule } from '../vector-store/vector-store.module.js';
import { EmbedService } from './embed.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([RaceResult]),
    VectorStoreModule,
    OpenAiModule,
  ],
  providers: [RaceResultSerializerService, EmbedService],
  exports: [EmbedService],
})
export class EmbedModule {}
