import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Job } from 'bullmq';
import type { Repository } from 'typeorm';
import { Race } from '../entities/race.entity.js';
import type { EmbedJobData } from '../queue/embed-job.types.js';
import { EMBED_QUEUE } from '../queue/queue.constants.js';
import { EMBED_STATUS } from './embed.constants.js';
import { EmbedService } from './embed.service.js';

@Processor(EMBED_QUEUE)
export class EmbedProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbedProcessor.name);

  constructor(
    private readonly embedService: EmbedService,
    @InjectRepository(Race) private readonly raceRepo: Repository<Race>,
  ) {
    super();
  }

  async process(job: Job<EmbedJobData>): Promise<void> {
    const { raceId } = job.data;
    this.logger.log(`Embedding race ${raceId} (job ${job.id})`);
    await this.embedService.batchEmbedRace(raceId);
    await this.raceRepo.update(raceId, {
      embeddingStatus: EMBED_STATUS.COMPLETE,
    });
    this.logger.log(`Finished embedding race ${raceId} (job ${job.id})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmbedJobData> | undefined, error: Error): void {
    this.logger.error(
      `Embedding job ${job?.id ?? 'unknown'} failed`,
      error.stack ?? String(error),
    );
    const raceId = job?.data.raceId;
    if (!raceId) return;
    this.raceRepo
      .update(raceId, { embeddingStatus: EMBED_STATUS.FAILED })
      .catch((err: unknown) => {
        this.logger.error(
          `Failed to set embedding_status=failed for race ${raceId}`,
          err instanceof Error ? err.stack : String(err),
        );
      });
  }
}
