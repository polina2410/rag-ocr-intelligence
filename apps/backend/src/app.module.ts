import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Athlete } from './entities/athlete.entity';
import { ObstacleSplit } from './entities/obstacle-split.entity';
import { Race } from './entities/race.entity';
import { RaceResult } from './entities/race-result.entity';
import { AskModule } from './ask/ask.module.js';
import { AthletesModule } from './athletes/athletes.module.js';
import { EmbedModule } from './embed/embed.module.js';
import { IngestionModule } from './ingestion/ingestion.module.js';
import { QueueModule } from './queue/queue.module.js';
import { RacesModule } from './races/races.module.js';
import { VectorStoreModule } from './vector-store/vector-store.module.js';

const DEFAULT_DB_PORT = 5432;

@Module({
  imports: [
    AskModule,
    AthletesModule,
    EmbedModule,
    IngestionModule,
    QueueModule,
    RacesModule,
    VectorStoreModule,
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')) || DEFAULT_DB_PORT,
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [Race, Athlete, RaceResult, ObstacleSplit],
        autoLoadEntities: true,
        synchronize: false,
        logging: ['error'],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
