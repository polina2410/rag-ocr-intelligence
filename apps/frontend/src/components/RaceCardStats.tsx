import { useQuery } from '@tanstack/react-query'
import { type RaceResultDto } from '@ocr/types'
import { getRace } from '../api/races'
import styles from './RaceCardStats.module.css'

const SECONDS_PER_HOUR = 3600
const SECONDS_PER_MINUTE = 60
const PERCENT = 100

const formatTime = (seconds: number): string => {
  if (seconds >= SECONDS_PER_HOUR) {
    const h = Math.floor(seconds / SECONDS_PER_HOUR)
    const m = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE)
    const s = seconds % SECONDS_PER_MINUTE
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  const m = Math.floor(seconds / SECONDS_PER_MINUTE)
  const s = seconds % SECONDS_PER_MINUTE
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const calcAvgTime = (results: RaceResultDto[]): string => {
  const times = results
    .filter((r) => r.status === 'FINISHED' && r.finishTimeSeconds !== null)
    .map((r) => r.finishTimeSeconds as number)
  if (times.length === 0) return '—'
  const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
  return formatTime(avg)
}

const calcDnfRate = (results: RaceResultDto[]): string => {
  if (results.length === 0) return '—'
  const dnfCount = results.filter((r) => r.status === 'DNF').length
  return `${((dnfCount / results.length) * PERCENT).toFixed(0)}%`
}

export const RaceCardStats = ({ raceId }: { raceId: string }) => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['race', raceId],
    queryFn: () => getRace(raceId),
  })

  if (isPending) {
    return (
      <div className={styles.shimmerRow}>
        <div className={styles.shimmerBlock} />
        <div className={styles.shimmerBlock} />
        <div className={styles.shimmerBlock} />
      </div>
    )
  }

  if (isError) return null

  const { results } = data
  const finisherCount = results.filter((r) => r.status === 'FINISHED').length

  return (
    <div className={styles.stats}>
      <div className={styles.stat}>
        <span className={styles.value}>{finisherCount}</span>
        <span className={styles.label}>finishers</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{calcAvgTime(results)}</span>
        <span className={styles.label}>avg time</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.value}>{calcDnfRate(results)}</span>
        <span className={styles.label}>DNF rate</span>
      </div>
    </div>
  )
}