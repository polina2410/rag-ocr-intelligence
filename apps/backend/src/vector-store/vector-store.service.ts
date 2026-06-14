import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { QdrantClient } from '@qdrant/js-client-rest';
import {
  EMBEDDING_DIMENSION,
  QDRANT_CLIENT,
  RACE_RESULTS_COLLECTION,
  VECTOR_DISTANCE,
} from './vector-store.constants.js';

export interface RaceResultPayload {
  raceResultId: string;
  raceId: string;
  athleteId: string;
  athleteName: string;
  raceName: string;
  raceDate: string;
}

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

const WAIT_FOR_UPSERT = true;

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

  async upsert(points: QdrantPoint[]): Promise<void> {
    if (points.length === 0) {
      return;
    }

    await this.client.upsert(RACE_RESULTS_COLLECTION, {
      wait: WAIT_FOR_UPSERT,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });

    this.logger.debug(
      `Upserted ${points.length} point(s) to "${RACE_RESULTS_COLLECTION}"`,
    );
  }

  async query(vector: number[], topK: number): Promise<QdrantResult[]> {
    const hits = await this.client.search(RACE_RESULTS_COLLECTION, {
      vector,
      limit: topK,
      with_payload: true,
    });

    return hits.map((hit) => ({
      id: String(hit.id),
      score: hit.score,
      payload: hit.payload ?? {},
    }));
  }
}
