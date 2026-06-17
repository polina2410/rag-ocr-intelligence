import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  EMBED_BACKOFF_DELAY_MS,
  EMBED_JOB_ATTEMPTS,
  EMBED_QUEUE,
} from './queue.constants.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.getOrThrow<string>('REDIS_HOST'),
          port: Number(config.getOrThrow<string>('REDIS_PORT')),
        },
      }),
    }),
    BullModule.registerQueue({
      name: EMBED_QUEUE,
      defaultJobOptions: {
        attempts: EMBED_JOB_ATTEMPTS,
        backoff: { type: 'exponential', delay: EMBED_BACKOFF_DELAY_MS },
      },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
