import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RaceResult } from './race-result.entity';

const OBSTACLE_NAME_MAX_LENGTH = 255;

@Entity('obstacle_splits')
export class ObstacleSplit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => RaceResult, (result) => result.splits)
  @JoinColumn({ name: 'race_result_id' })
  raceResult!: RaceResult;

  @Column({ type: 'uuid', name: 'race_result_id' })
  raceResultId!: string;

  @Column({ type: 'int', name: 'obstacle_number' })
  obstacleNumber!: number;

  @Column({
    type: 'varchar',
    length: OBSTACLE_NAME_MAX_LENGTH,
    name: 'obstacle_name',
  })
  obstacleName!: string;

  @Column({ type: 'int', name: 'split_time_seconds', nullable: true })
  splitTimeSeconds!: number | null;

  @Column({ type: 'int', name: 'penalty_count', default: 0 })
  penaltyCount!: number;
}
