import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import type { AthleteDto } from '@ocr/types';

const FIRST_NAME_MAX_LENGTH = 255;
const LAST_NAME_MAX_LENGTH = 255;
const NATIONALITY_MAX_LENGTH = 255;
const CATEGORY_MAX_LENGTH = 255;

@Entity('athletes')
export class Athlete {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: FIRST_NAME_MAX_LENGTH,
    name: 'first_name',
  })
  firstName!: string;

  @Column({ type: 'varchar', length: LAST_NAME_MAX_LENGTH, name: 'last_name' })
  lastName!: string;

  @Column({ type: 'varchar', length: NATIONALITY_MAX_LENGTH })
  nationality!: string;

  @Column({ type: 'varchar', length: CATEGORY_MAX_LENGTH })
  category!: AthleteDto['category'];
}
