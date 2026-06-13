import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../entities/athlete.entity';
import { ObstacleSplit } from '../entities/obstacle-split.entity';
import { Race } from '../entities/race.entity';
import { RaceResult } from '../entities/race-result.entity';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Race, RaceResult, ObstacleSplit, Athlete]),
  ],
  controllers: [RacesController],
  providers: [RacesService],
})
export class RacesModule {}
