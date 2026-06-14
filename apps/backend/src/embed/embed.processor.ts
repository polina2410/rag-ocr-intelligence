import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { EmbedJobData } from '../queue/embed-job.types.js';
import { EMBED_QUEUE } from '../queue/queue.constants.js';
import { EmbedService } from './embed.service.js';

@Processor(EMBED_QUEUE)
export class EmbedProcessor extends WorkerHost {
  private readonly logger = new Logger(EmbedProcessor.name);

  constructor(private readonly embedService: EmbedService) {
    super();
  }

  async process(job: Job<EmbedJobData>): Promise<void> {
    const { raceId } = job.data;
    this.logger.log(`Embedding race ${raceId} (job ${job.id})`);
    await this.embedService.batchEmbedRace(raceId);
    this.logger.log(`Finished embedding race ${raceId} (job ${job.id})`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<EmbedJobData> | undefined, error: Error): void {
    this.logger.error(
      `Embedding job ${job?.id ?? 'unknown'} failed`,
      error.stack ?? String(error),
    );
  }
}
