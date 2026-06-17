import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import type { RaceDto } from '@ocr/types';
import { EMBED_STATUS } from '../embed/embed.constants';
import type { RaceResult } from './race-result.entity';

const NAME_MAX_LENGTH = 255;
const LOCATION_MAX_LENGTH = 255;
const DISTANCE_PRECISION = 6;
const DISTANCE_SCALE = 2;
const RACE_TYPE_MAX_LENGTH = 20;
const EMBED_STATUS_MAX_LENGTH = 20;

@Entity('races')
export class Race {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: NAME_MAX_LENGTH })
  name!: string;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'varchar', length: LOCATION_MAX_LENGTH })
  location!: string;

  @Column({
    type: 'numeric',
    precision: DISTANCE_PRECISION,
    scale: DISTANCE_SCALE,
    name: 'distance_km',
  })
  distanceKm!: number;

  @Column({ type: 'int', name: 'total_obstacles' })
  totalObstacles!: number;

  @Column({ type: 'varchar', length: RACE_TYPE_MAX_LENGTH, name: 'race_type' })
  raceType!: RaceDto['raceType'];

  @Column({
    type: 'varchar',
    length: EMBED_STATUS_MAX_LENGTH,
    name: 'embedding_status',
    default: EMBED_STATUS.PENDING,
  })
  embeddingStatus!: RaceDto['embeddingStatus'];

  @OneToMany('RaceResult', 'race')
  results!: RaceResult[];
}
