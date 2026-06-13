import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Race } from '../entities/race.entity';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';

@Module({
  imports: [TypeOrmModule.forFeature([Race])],
  controllers: [RacesController],
  providers: [RacesService],
})
export class RacesModule {}
