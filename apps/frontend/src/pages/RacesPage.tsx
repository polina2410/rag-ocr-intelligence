import { useQuery } from '@tanstack/react-query'
import { EmptyState } from '../components/EmptyState'
import { PageWrapper } from '../components/PageWrapper'
import { RaceCard } from '../components/RaceCard'
import { RacesHero } from '../components/RacesHero'
import { SkeletonCard } from '../components/SkeletonCard'
import { getRaces } from '../api/races'
import styles from './RacesPage.module.css'

const SKELETON_COUNT = 6
const POLL_INTERVAL_MS = 3000

const RacesPage = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['races'],
    queryFn: () => getRaces(),
    refetchInterval: (query) =>
      query.state.data?.data.some((r) => r.embeddingStatus === 'pending')
        ? POLL_INTERVAL_MS
        : false,
  })

  const renderBody = () => {
    if (isPending) {
      return (
        <div className={styles.grid}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )
    }

    if (isError) {
      return <p role="alert">Failed to load races.</p>
    }

    if (data.data.length === 0) {
      return <EmptyState title="No races found" description="Upload a CSV to get started." />
    }

    return (
      <div className={styles.grid}>
        {data.data.map((race) => (
          <RaceCard key={race.id} race={race} />
        ))}
      </div>
    )
  }

  return (
    <PageWrapper>
      <RacesHero />
      {renderBody()}
    </PageWrapper>
  )
}

export default RacesPage