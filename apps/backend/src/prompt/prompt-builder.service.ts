import { Injectable } from '@nestjs/common';
import type OpenAI from 'openai';
import type { RetrievedChunk } from '../retrieve/retrieve.service.js';
import {
  CONTEXT_DELIMITER,
  CONTEXT_HEADER,
  NO_CONTEXT_INSTRUCTION,
  SYSTEM_INSTRUCTION,
} from './prompt.constants.js';

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

@Injectable()
export class PromptBuilderService {
  /**
   * Assembles the OpenAI chat messages for a RAG answer: a system message
   * carrying the instructions plus the retrieved context, and a user message
   * carrying the raw query. Pure — deterministic on (query, chunks) only.
   *
   * NOTE: the full context block is included as-is. Token-budget truncation of
   * the context is a known future concern (see PLAN.md) and is intentionally
   * not implemented here.
   */
  buildMessages(query: string, chunks: RetrievedChunk[]): ChatMessage[] {
    const contextTexts = chunks
      .map((chunk) => chunk.metadata.text)
      .filter((text) => typeof text === 'string' && text.trim().length > 0);

    const systemContent =
      contextTexts.length > 0
        ? this.withContext(contextTexts)
        : NO_CONTEXT_INSTRUCTION;

    return [
      { role: 'system', content: systemContent },
      { role: 'user', content: query },
    ];
  }

  private withContext(contextTexts: string[]): string {
    const numbered = contextTexts
      .map((text, index) => `${index + 1}. ${text}`)
      .join(CONTEXT_DELIMITER);
    return `${SYSTEM_INSTRUCTION}\n\n${CONTEXT_HEADER}\n${numbered}`;
  }
}
