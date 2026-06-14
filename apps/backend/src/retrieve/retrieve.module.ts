import { Module } from '@nestjs/common';
import { EmbedModule } from '../embed/embed.module.js';
import { VectorStoreModule } from '../vector-store/vector-store.module.js';
import { RetrieveService } from './retrieve.service.js';

@Module({
  imports: [EmbedModule, VectorStoreModule],
  providers: [RetrieveService],
  exports: [RetrieveService],
})
export class RetrieveModule {}
