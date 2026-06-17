import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type PaginatedResponse, type RaceDto } from '@ocr/types'
import { deleteRace } from '../api/races'
import { Badge } from './Badge'
import { RaceCardStats } from './RaceCardStats'
import styles from './RaceCard.module.css'

export interface RaceCardProps {
  race: RaceDto
}

const TOTAL_DECREMENT = 1

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export const RaceCard = ({ race }: RaceCardProps) => {
  const [hovered, setHovered] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteRace(race.id),
    onSuccess: () => {
      queryClient.setQueryData<PaginatedResponse<RaceDto>>(['races'], (prev) => {
        if (!prev) return prev
        return {
          ...prev,
          data: prev.data.filter((r) => r.id !== race.id),
          total: prev.total - TOTAL_DECREMENT,
        }
      })
    },
  })

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm(`Delete "${race.name}"? This cannot be undone.`)) return
    mutation.mutate()
  }

  return (
    <Link
      to={`/races/${race.id}`}
      className={styles.card}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={styles.name}>{race.name}</span>
      <Badge label={race.raceType} variant={race.raceType} />
      <ul className={styles.details}>
        <li className={styles.detail}>{dateFormatter.format(new Date(race.date))}</li>
        <li className={styles.detail}>{race.location}</li>
        <li className={styles.detail}>{race.distanceKm} km</li>
        <li className={styles.detail}>{race.totalObstacles} obstacles</li>
      </ul>
      {hovered && <RaceCardStats raceId={race.id} />}
      {hovered && (
        <button
          className={styles.deleteButton}
          onClick={handleDelete}
          disabled={mutation.isPending}
          aria-busy={mutation.isPending}
          aria-label={`Delete ${race.name}`}
        >
          {mutation.isPending ? 'Deleting…' : 'Delete'}
        </button>
      )}
      {mutation.isError && (
        <p className={styles.deleteError}>Failed to delete race.</p>
      )}
    </Link>
  )
}