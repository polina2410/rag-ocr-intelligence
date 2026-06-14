import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import OpenAI from 'openai';
import { RaceResult } from '../entities/race-result.entity.js';
import { RaceResultSerializerService } from '../serializer/race-result-serializer.service.js';
import { VectorStoreModule } from '../vector-store/vector-store.module.js';
import { OPENAI_CLIENT } from './embed.constants.js';
import { EmbedService } from './embed.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([RaceResult]), VectorStoreModule],
  providers: [
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') }),
    },
    RaceResultSerializerService,
    EmbedService,
  ],
  exports: [EmbedService],
})
export class EmbedModule {}