import { Module } from '@nestjs/common';
import { GenerateModule } from '../generate/generate.module.js';
import { PromptModule } from '../prompt/prompt.module.js';
import { RetrieveModule } from '../retrieve/retrieve.module.js';
import { AskController } from './ask.controller.js';

@Module({
  imports: [RetrieveModule, PromptModule, GenerateModule],
  controllers: [AskController],
})
export class AskModule {}
