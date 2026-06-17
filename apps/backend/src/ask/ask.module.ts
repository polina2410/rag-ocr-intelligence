import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { GenerateModule } from '../generate/generate.module.js';
import { PromptModule } from '../prompt/prompt.module.js';
import { RetrieveModule } from '../retrieve/retrieve.module.js';
import {
  ASK_THROTTLE_LIMIT,
  ASK_THROTTLE_TTL_MS,
} from './ask-throttle.constants.js';
import { AskController } from './ask.controller.js';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      { ttl: ASK_THROTTLE_TTL_MS, limit: ASK_THROTTLE_LIMIT },
    ]),
    RetrieveModule,
    PromptModule,
    GenerateModule,
  ],
  controllers: [AskController],
})
export class AskModule {}
