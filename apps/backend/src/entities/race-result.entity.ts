import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ObstacleSplit } from './obstacle-split.entity';
import { Athlete } from './athlete.entity';
import { Race } from './race.entity';

const STATUS_MAX_LENGTH = 10;

@Entity('race_results')
export class RaceResult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Race, (race) => race.results)
  @JoinColumn({ name: 'race_id' })
  race!: Race;

  @Column({ type: 'uuid', name: 'race_id' })
  raceId!: string;

  @ManyToOne(() => Athlete)
  @JoinColumn({ name: 'athlete_id' })
  athlete!: Athlete;

  @Column({ type: 'uuid', name: 'athlete_id' })
  athleteId!: string;

  @Column({ type: 'int', name: 'overall_position', nullable: true })
  overallPosition!: number | null;

  @Column({ type: 'int', name: 'finish_time_seconds', nullable: true })
  finishTimeSeconds!: number | null;

  @Column({
    type: 'varchar',
    length: STATUS_MAX_LENGTH,
    name: 'status',
    default: 'FINISHED',
  })
  status!: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ';

  @Column({ type: 'int', name: 'category_position', nullable: true })
  categoryPosition!: number | null;

  @Column({ type: 'int', name: 'gender_position', nullable: true })
  genderPosition!: number | null;

  @OneToMany('ObstacleSplit', 'raceResult')
  splits!: ObstacleSplit[];
}
