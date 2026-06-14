import { Inject, Injectable } from '@nestjs/common';
import type OpenAI from 'openai';
import { EMBEDDING_MODEL, OPENAI_CLIENT } from './embed.constants.js';

@Injectable()
export class EmbedService {
  constructor(@Inject(OPENAI_CLIENT) private readonly client: OpenAI) {}

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      input: text,
      model: EMBEDDING_MODEL,
    });
    return response.data[0].embedding;
  }
}