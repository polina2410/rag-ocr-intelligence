import { Module } from '@nestjs/common';
import { OpenAiModule } from '../openai/openai.module.js';
import { GenerateService } from './generate.service.js';

@Module({
  imports: [OpenAiModule],
  providers: [GenerateService],
  exports: [GenerateService],
})
export class GenerateModule {}
