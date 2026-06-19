import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageWrapper } from '../components/PageWrapper'
import { RaceHeader } from '../components/RaceHeader'
import { ObstacleSplitChart } from '../components/ObstacleSplitChart'
import { PenaltyRateChart } from '../components/PenaltyRateChart'
import { CategoryFilter } from '../components/CategoryFilter'
import { AthleteLeaderboard } from '../components/AthleteLeaderboard'
import { SkeletonChart } from '../components/SkeletonChart'
import { SkeletonTable } from '../components/SkeletonTable'
import { getRace, triggerEmbed } from '../api/races'
import styles from './RaceDetailPage.module.css'

const RaceDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: race, isPending, isError } = useQuery({
    queryKey: ['race', id],
    queryFn: () => getRace(id as string),
    enabled: Boolean(id),
  })

  const embedMutation = useMutation({
    mutationFn: () => triggerEmbed(id as string),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['race', id] })
    },
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
        {race.embeddingStatus !== 'complete' && (
          <div className={styles.embedBanner}>
            <span className={styles[`embedStatus_${race.embeddingStatus}`]}>
              AI search: {race.embeddingStatus}
            </span>
            <button
              className={styles.embedButton}
              onClick={() => embedMutation.mutate()}
              disabled={embedMutation.isPending}
            >
              {embedMutation.isPending ? 'Queuing…' : 'Run embedding'}
            </button>
            {embedMutation.isError && (
              <span className={styles.embedError} role="alert">Failed to enqueue</span>
            )}
          </div>
        )}
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