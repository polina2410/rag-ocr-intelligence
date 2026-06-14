import { Module } from '@nestjs/common';
import { PromptBuilderService } from './prompt-builder.service.js';

@Module({
  providers: [PromptBuilderService],
  exports: [PromptBuilderService],
})
export class PromptModule {}
