import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type PaginatedResponse, type RaceDto } from '@ocr/types'
import { deleteRace } from '../api/races'
import { Badge } from './Badge'
import { ConfirmDialog } from './ConfirmDialog'
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
  const [confirmOpen, setConfirmOpen] = useState(false)
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
      setConfirmOpen(false)
    },
  })

  const openConfirm = () => {
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    if (mutation.isPending) return
    setConfirmOpen(false)
    mutation.reset()
  }

  return (
    <>
      <div
        className={styles.root}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => {
          if (!confirmOpen && !e.currentTarget.contains(e.relatedTarget as Node)) {
            setHovered(false)
          }
        }}
      >
        <Link to={`/races/${race.id}`} className={styles.card}>
          <span className={styles.name}>{race.name}</span>
          <Badge label={race.raceType} variant={race.raceType} />
          {race.embeddingStatus === 'pending' && (
            <span className={styles.statusPending} aria-label="Embedding in progress">
              Indexing for AI…
            </span>
          )}
          {race.embeddingStatus === 'failed' && (
            <span className={styles.statusFailed} aria-label="Embedding failed">
              AI indexing failed
            </span>
          )}
          <ul className={styles.details}>
            <li className={styles.detail}>{dateFormatter.format(new Date(race.date))}</li>
            <li className={styles.detail}>{race.location}</li>
            <li className={styles.detail}>{race.distanceKm} km</li>
            <li className={styles.detail}>{race.totalObstacles} obstacles</li>
          </ul>
          {hovered && <RaceCardStats raceId={race.id} />}
        </Link>
        {hovered && (
          <button
            className={styles.deleteButton}
            onClick={openConfirm}
            disabled={mutation.isPending}
            aria-busy={mutation.isPending}
            aria-label={`Delete ${race.name}`}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
          </button>
        )}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this race?"
        message={
          <>
            <strong>{race.name}</strong> and all of its results will be permanently
            removed. This action cannot be undone.
          </>
        }
        confirmLabel={mutation.isPending ? 'Deleting…' : 'Delete race'}
        cancelLabel="Keep race"
        tone="danger"
        isPending={mutation.isPending}
        errorMessage={mutation.isError ? 'Failed to delete race. Please try again.' : null}
        onConfirm={() => mutation.mutate()}
        onCancel={closeConfirm}
      />
    </>
  )
}