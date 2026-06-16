import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PageWrapper } from '../components/PageWrapper'
import { RaceHeader } from '../components/RaceHeader'
import { ObstacleSplitChart } from '../components/ObstacleSplitChart'
import { PenaltyRateChart } from '../components/PenaltyRateChart'
import { CategoryFilter } from '../components/CategoryFilter'
import { AthleteLeaderboard } from '../components/AthleteLeaderboard'
import { SkeletonChart } from '../components/SkeletonChart'
import { SkeletonTable } from '../components/SkeletonTable'
import { getRace } from '../api/races'
import styles from './RaceDetailPage.module.css'

const RaceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const { data: race, isPending, isError } = useQuery({
    queryKey: ['race', id],
    queryFn: () => getRace(id as string),
    enabled: Boolean(id),
  })

  const categories = useMemo(
    () => [...new Set((race?.results ?? []).map((result) => result.athlete.category).filter(Boolean))],
    [race?.results],
  )

  const renderBody = () => {
    if (!id) {
      return (
        <>
          <h1>Race</h1>
          <p role="status">Race not found.</p>
        </>
      )
    }

    if (isPending) {
      return (
        <>
          <h1>Race</h1>
          <div className={styles.charts} role="status" aria-label="Loading race details">
            <SkeletonChart />
            <SkeletonChart />
          </div>
          <SkeletonTable />
        </>
      )
    }

    if (isError) {
      return (
        <>
          <h1>Race</h1>
          <p role="alert">Failed to load race.</p>
        </>
      )
    }

    return (
      <>
        <RaceHeader race={race} />
        <div className={styles.charts}>
          <ObstacleSplitChart results={race.results} />
          <PenaltyRateChart results={race.results} />
        </div>
        <div className={styles.section}>
          <CategoryFilter
            categories={categories}
            value={selectedCategory}
            onChange={setSelectedCategory}
          />
        </div>
        <AthleteLeaderboard results={race.results} categoryFilter={selectedCategory} />
      </>
    )
  }

  return <PageWrapper>{renderBody()}</PageWrapper>
}

export default RaceDetailPage