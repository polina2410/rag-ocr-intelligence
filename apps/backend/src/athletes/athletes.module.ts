import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../entities/athlete.entity';
import { AthletesController } from './athletes.controller';
import { AthletesService } from './athletes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Athlete])],
  controllers: [AthletesController],
  providers: [AthletesService],
})
export class AthletesModule {}
