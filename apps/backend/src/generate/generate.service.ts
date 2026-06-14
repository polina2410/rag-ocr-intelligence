import { Inject, Injectable } from '@nestjs/common';
import type OpenAI from 'openai';
import { OPENAI_CLIENT } from '../openai/openai.constants.js';
import { CHAT_MODEL } from './generate.constants.js';

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

@Injectable()
export class GenerateService {
  constructor(@Inject(OPENAI_CLIENT) private readonly client: OpenAI) {}

  /**
   * Opens a streaming chat completion and yields each content token delta as a
   * plain string. Errors from the OpenAI client propagate unwrapped. The
   * downstream SSE handler (step 35) consumes this async iterable.
   *
   * `signal` aborts the in-flight request — the caller (step 36) wires it to an
   * AbortController triggered on client disconnect. It belongs in the request
   * options (2nd arg), not the body.
   */
  async *generate(
    messages: ChatMessage[],
    signal?: AbortSignal,
  ): AsyncGenerator<string> {
    const stream = await this.client.chat.completions.create(
      {
        model: CHAT_MODEL,
        messages,
        stream: true,
      },
      { signal },
    );

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }
}
