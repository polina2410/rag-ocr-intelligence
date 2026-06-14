import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { writeSse } from '../common/sse/sse-stream.js';
import { GenerateService } from '../generate/generate.service.js';
import { PromptBuilderService } from '../prompt/prompt-builder.service.js';
import { RetrieveService } from '../retrieve/retrieve.service.js';
import { AskQueryDto } from './dto/ask-query.dto.js';

@ApiTags('ask')
@Controller('ask')
export class AskController {
  constructor(
    private readonly retrieve: RetrieveService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly generate: GenerateService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Ask a question about the race data (streaming)',
    description:
      'Runs the RAG pipeline (retrieve → prompt → generate) and streams the ' +
      'answer as Server-Sent Events. The response is a `text/event-stream`: ' +
      'each `data:` frame is a JSON-encoded token string, the stream ends with ' +
      'an `event: done` frame (`data: [DONE]`), and failures emit an ' +
      '`event: error` frame. Retrieval/prompt errors return a normal JSON ' +
      'error before streaming begins.',
  })
  @ApiBody({ type: AskQueryDto })
  async ask(@Body() dto: AskQueryDto, @Res() res: Response): Promise<void> {
    const chunks = await this.retrieve.retrieve(dto.query);
    const messages = this.promptBuilder.buildMessages(dto.query, chunks);

    const controller = new AbortController();
    await writeSse(
      res,
      this.generate.generate(messages, controller.signal),
      () => controller.abort(),
    );
  }
}
