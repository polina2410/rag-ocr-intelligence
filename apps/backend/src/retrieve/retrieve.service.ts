import { Injectable } from '@nestjs/common';
import { EmbedService } from '../embed/embed.service.js';
import {
  RaceResultPayload,
  VectorStoreService,
} from '../vector-store/vector-store.service.js';

// Race-level questions ("who won", "podium", "how many finished") need the
// whole race field in context, not just the few most semantically-similar rows.
// A race's results all share the same race-name text, so vector similarity ranks
// them almost equally and the answer-bearing row (e.g. the winner) routinely
// falls outside a small top-K. Same-race rows cluster above other races' rows
// for a race-specific query, so retrieving enough to cover a full field (~20
// finishers here, with headroom) is low-risk. gpt-4o-mini's 128k context easily
// absorbs the extra rows.
export const DEFAULT_TOP_K = 25;

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
