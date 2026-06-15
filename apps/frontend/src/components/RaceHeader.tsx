import { type RaceDto } from '@ocr/types'
import { Badge } from './Badge'
import styles from './RaceHeader.module.css'

export interface RaceHeaderProps {
  race: RaceDto
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const RaceHeader = ({ race }: RaceHeaderProps) => (
  <div className={styles.header}>
    <h1 className={styles.name}>{race.name}</h1>
    <div className={styles.meta}>
      <Badge label={race.raceType} variant={race.raceType} />
    </div>
    <ul className={styles.details}>
      <li className={styles.detail}>{dateFormatter.format(new Date(race.date))}</li>
      <li className={styles.detail}>{race.location}</li>
      <li className={styles.detail}>{race.distanceKm} km</li>
      <li className={styles.detail}>{race.totalObstacles} obstacles</li>
    </ul>
  </div>
)