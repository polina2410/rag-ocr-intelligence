import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type OpenAI from 'openai';
import { Repository } from 'typeorm';
import { RaceResult } from '../entities/race-result.entity.js';
import { RaceResultSerializerService } from '../serializer/race-result-serializer.service.js';
import {
  QdrantPoint,
  RaceResultPayload,
  VectorStoreService,
} from '../vector-store/vector-store.service.js';
import { EMBEDDING_MODEL, OPENAI_CLIENT } from './embed.constants.js';

@Injectable()
export class EmbedService {
  constructor(
    @Inject(OPENAI_CLIENT) private readonly client: OpenAI,
    @InjectRepository(RaceResult)
    private readonly raceResultRepo: Repository<RaceResult>,
    private readonly serializer: RaceResultSerializerService,
    private readonly vectorStore: VectorStoreService,
  ) {}

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      input: text,
      model: EMBEDDING_MODEL,
    });
    return response.data[0].embedding;
  }

  async batchEmbedRace(raceId: string): Promise<void> {
    const results = await this.raceResultRepo.find({
      where: { raceId },
      relations: { race: true, athlete: true, splits: true },
    });

    if (results.length === 0) {
      return;
    }

    const points: QdrantPoint[] = [];
    for (const result of results) {
      const chunk = this.serializer.serialize(result);
      const vector = await this.embed(chunk);
      const payload: RaceResultPayload = {
        raceResultId: result.id,
        raceId: result.raceId,
        athleteId: result.athleteId,
        athleteName: `${result.athlete.firstName} ${result.athlete.lastName}`,
        raceName: result.race.name,
        raceDate: result.race.date,
      };
      points.push({
        id: result.id,
        vector,
        payload: payload as unknown as Record<string, unknown>,
      });
    }

    await this.vectorStore.upsert(points);
  }
}
