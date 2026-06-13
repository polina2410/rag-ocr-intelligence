import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QDRANT_CLIENT } from './vector-store.constants.js';
import { VectorStoreService } from './vector-store.service.js';

@Module({
  providers: [
    {
      provide: QDRANT_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new QdrantClient({
          url: config.getOrThrow<string>('QDRANT_URL'),
          apiKey: config.get<string>('QDRANT_API_KEY'),
        }),
    },
    VectorStoreService,
  ],
  exports: [QDRANT_CLIENT, VectorStoreService],
})
export class VectorStoreModule {}
