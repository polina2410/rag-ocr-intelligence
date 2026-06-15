import { useQuery } from '@tanstack/react-query'
import { PageWrapper } from '../components/PageWrapper'
import { RaceCard } from '../components/RaceCard'
import { SkeletonCard } from '../components/SkeletonCard'
import { getRaces } from '../api/races'
import styles from './RacesPage.module.css'

const SKELETON_COUNT = 6

const RacesPage = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: ['races'],
    queryFn: () => getRaces(),
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
      return <p>Failed to load races.</p>
    }

    if (data.data.length === 0) {
      return <p>No races found.</p>
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
      <h1>Races</h1>
      {renderBody()}
    </PageWrapper>
  )
}

export default RacesPage