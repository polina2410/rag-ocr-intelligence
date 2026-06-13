import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../entities/athlete.entity';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import { AthletesController } from './athletes.controller';
import { AthletesService } from './athletes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Athlete, RaceResult, Race, ObstacleSplit]),
  ],
  controllers: [AthletesController],
  providers: [AthletesService],
})
export class AthletesModule {}
