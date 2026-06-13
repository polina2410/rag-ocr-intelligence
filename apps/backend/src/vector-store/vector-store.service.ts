import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { QdrantClient } from '@qdrant/js-client-rest';
import {
  EMBEDDING_DIMENSION,
  QDRANT_CLIENT,
  RACE_RESULTS_COLLECTION,
  VECTOR_DISTANCE,
} from './vector-store.constants.js';

export interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface QdrantResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

@Injectable()
export class VectorStoreService implements OnModuleInit {
  private readonly logger = new Logger(VectorStoreService.name);

  constructor(@Inject(QDRANT_CLIENT) private readonly client: QdrantClient) {}

  async onModuleInit(): Promise<void> {
    const { exists } = await this.client.collectionExists(
      RACE_RESULTS_COLLECTION,
    );

    if (exists) {
      this.logger.log(
        `Collection "${RACE_RESULTS_COLLECTION}" already exists — skipping creation`,
      );
      return;
    }

    await this.client.createCollection(RACE_RESULTS_COLLECTION, {
      vectors: { size: EMBEDDING_DIMENSION, distance: VECTOR_DISTANCE },
    });
    this.logger.log(
      `Collection "${RACE_RESULTS_COLLECTION}" created (dim=${EMBEDDING_DIMENSION}, distance=${VECTOR_DISTANCE})`,
    );
  }

  upsert(_points: QdrantPoint[]): Promise<void> {
    return Promise.reject(new Error('not implemented — see step 27'));
  }

  query(_vector: number[], _topK: number): Promise<QdrantResult[]> {
    return Promise.reject(new Error('not implemented — see step 28'));
  }
}
