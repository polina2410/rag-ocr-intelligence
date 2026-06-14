import { Injectable } from '@nestjs/common';
import { EmbedService } from '../embed/embed.service.js';
import {
  RaceResultPayload,
  VectorStoreService,
} from '../vector-store/vector-store.service.js';

export const DEFAULT_TOP_K = 5;

export interface RetrievedChunk {
  id: string;
  score: number;
  metadata: RaceResultPayload;
}

@Injectable()
export class RetrieveService {
  constructor(
    private readonly embed: EmbedService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  async retrieve(
    query: string,
    topK: number = DEFAULT_TOP_K,
  ): Promise<RetrievedChunk[]> {
    const vector = await this.embed.embed(query);
    const hits = await this.vectorStore.query(vector, topK);

    return hits.map((hit) => ({
      id: hit.id,
      score: hit.score,
      metadata: hit.payload as unknown as RaceResultPayload,
    }));
  }
}
