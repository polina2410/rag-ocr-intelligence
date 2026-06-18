import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { type RaceResultDto } from '@ocr/types'
import styles from './ObstacleSplitChart.module.css'

export interface ObstacleSplitChartProps {
  results: RaceResultDto[]
}

type ChartEntry = { name: string; avgSeconds: number }

const ACCENT_COLOR = '#6366f1'
const SECONDS_PER_MINUTE = 60
const BAR_HEIGHT = 40

function computeAvgSplits(results: RaceResultDto[]): ChartEntry[] {
  const acc = new Map<number, { name: string; total: number; count: number }>()

  for (const result of results) {
    if (result.status !== 'FINISHED') continue
    for (const split of result.splits) {
      if (split.splitTimeSeconds === null) continue
      const existing = acc.get(split.obstacleNumber)
      if (existing) {
        existing.total += split.splitTimeSeconds
        existing.count += 1
      } else {
        acc.set(split.obstacleNumber, {
          name: split.obstacleName,
          total: split.splitTimeSeconds,
          count: 1,
        })
      }
    }
  }

  return Array.from(acc.entries())
    .sort(([a], [b]) => a - b)
    .map(([, { name, total, count }]) => ({ name, avgSeconds: total / count }))
}

function formatMmss(seconds: number): string {
  const m = Math.floor(seconds / SECONDS_PER_MINUTE)
  const s = Math.round(seconds % SECONDS_PER_MINUTE)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export const ObstacleSplitChart = ({ results }: ObstacleSplitChartProps) => {
  const data = computeAvgSplits(results)

  if (data.length === 0) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.title}>Avg Time per Obstacle</p>
        <p>No split data available.</p>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Avg Time per Obstacle</p>
      <div role="img" aria-label="Bar chart: average split time per obstacle in seconds">
      <ResponsiveContainer width="100%" height={data.length * BAR_HEIGHT + 40}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 13 }} />
          <XAxis type="number" tickFormatter={(v: number) => formatMmss(v)} />
          <Tooltip formatter={(value) => formatMmss(Number(value))} />
          <Bar dataKey="avgSeconds" fill={ACCENT_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}