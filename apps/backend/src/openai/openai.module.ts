import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OPENAI_CLIENT } from './openai.constants.js';

@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') }),
    },
  ],
  exports: [OPENAI_CLIENT],
})
export class OpenAiModule {}
