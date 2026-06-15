import { Link } from 'react-router-dom'
import { type RaceDto } from '@ocr/types'
import { Badge } from './Badge'
import styles from './RaceCard.module.css'

export interface RaceCardProps {
  race: RaceDto
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const RaceCard = ({ race }: RaceCardProps) => (
  <Link to={`/races/${race.id}`} className={styles.card}>
    <span className={styles.name}>{race.name}</span>
    <Badge label={race.raceType} variant={race.raceType} />
    <ul className={styles.details}>
      <li className={styles.detail}>{dateFormatter.format(new Date(race.date))}</li>
      <li className={styles.detail}>{race.location}</li>
      <li className={styles.detail}>{race.distanceKm} km</li>
      <li className={styles.detail}>{race.totalObstacles} obstacles</li>
    </ul>
  </Link>
)