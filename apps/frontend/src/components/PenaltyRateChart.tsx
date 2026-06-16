import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { type RaceResultDto } from '@ocr/types'
import styles from './PenaltyRateChart.module.css'

export interface PenaltyRateChartProps {
  results: RaceResultDto[]
}

type ChartEntry = { name: string; penaltyRate: number }

const PENALTY_COLOR = '#ef4444'
const BAR_HEIGHT = 40
const PERCENT = 100

function computePenaltyRates(results: RaceResultDto[]): ChartEntry[] {
  const acc = new Map<number, { name: string; penalised: number; total: number }>()

  for (const result of results) {
    if (result.status !== 'FINISHED') continue
    for (const split of result.splits) {
      const existing = acc.get(split.obstacleNumber)
      if (existing) {
        existing.total += 1
        if (split.penaltyCount > 0) existing.penalised += 1
      } else {
        acc.set(split.obstacleNumber, {
          name: split.obstacleName,
          penalised: split.penaltyCount > 0 ? 1 : 0,
          total: 1,
        })
      }
    }
  }

  return Array.from(acc.entries())
    .sort(([a], [b]) => a - b)
    .map(([, { name, penalised, total }]) => ({
      name,
      penaltyRate: (penalised / total) * PERCENT,
    }))
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export const PenaltyRateChart = ({ results }: PenaltyRateChartProps) => {
  const data = computePenaltyRates(results)

  if (data.length === 0) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.title}>Penalty Rate per Obstacle</p>
        <p>No penalty data available.</p>
      </div>
    )
  }

  const hasPenalties = data.some((entry) => entry.penaltyRate > 0)

  return (
    <div className={styles.wrapper}>
      <p className={styles.title}>Penalty Rate per Obstacle</p>
      {!hasPenalties && <p className={styles.note}>No penalties recorded.</p>}
      <ResponsiveContainer width="100%" height={data.length * BAR_HEIGHT + 40}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 13 }} />
          <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip formatter={(value) => formatPercent(Number(value))} />
          <Bar dataKey="penaltyRate" fill={PENALTY_COLOR} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}