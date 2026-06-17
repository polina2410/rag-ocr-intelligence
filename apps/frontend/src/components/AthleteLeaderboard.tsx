import { useState } from 'react'
import { type RaceResultDto } from '@ocr/types'
import { Badge } from './Badge'
import { EmptyState } from './EmptyState'
import styles from './AthleteLeaderboard.module.css'

export interface AthleteLeaderboardProps {
  results: RaceResultDto[]
  categoryFilter: string | null
}

type SortKey = 'overallPosition' | 'finishTimeSeconds' | 'name' | 'categoryPosition'
type SortDir = 'asc' | 'desc'

interface SortState {
  key: SortKey
  dir: SortDir
}

interface ColumnDef {
  label: string
  widthClass: string
  sortKey?: SortKey
}

const SECONDS_PER_MINUTE = 60
const NOT_AVAILABLE = '—'

const COLUMNS: ColumnDef[] = [
  { label: 'Position', widthClass: styles.colPosition, sortKey: 'overallPosition' },
  { label: 'Name', widthClass: styles.colName, sortKey: 'name' },
  { label: 'Category', widthClass: styles.colCategory },
  { label: 'Finish Time', widthClass: styles.colTime, sortKey: 'finishTimeSeconds' },
  { label: 'Overall', widthClass: styles.colPlace, sortKey: 'overallPosition' },
  { label: 'Category place', widthClass: styles.colPlace, sortKey: 'categoryPosition' },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / SECONDS_PER_MINUTE)
  const s = Math.round(seconds % SECONDS_PER_MINUTE)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getFinishTimeCell(result: RaceResultDto): string {
  if (result.status !== 'FINISHED') return result.status
  if (result.finishTimeSeconds === null) return NOT_AVAILABLE
  return formatTime(result.finishTimeSeconds)
}

function getSortValue(result: RaceResultDto, key: SortKey): number | string | null {
  switch (key) {
    case 'overallPosition':
      return result.overallPosition
    case 'finishTimeSeconds':
      return result.finishTimeSeconds
    case 'categoryPosition':
      return result.categoryPosition
    case 'name':
      return `${result.athlete.firstName} ${result.athlete.lastName}`
  }
}

function compareResults(a: RaceResultDto, b: RaceResultDto, sort: SortState): number {
  const aValue = getSortValue(a, sort.key)
  const bValue = getSortValue(b, sort.key)

  if (aValue === null && bValue === null) return 0
  if (aValue === null) return 1
  if (bValue === null) return -1

  const direction = sort.dir === 'asc' ? 1 : -1
  if (typeof aValue === 'string' || typeof bValue === 'string') {
    return aValue.toString().localeCompare(bValue.toString()) * direction
  }
  return (aValue - bValue) * direction
}

function getDisplayRows(
  results: RaceResultDto[],
  categoryFilter: string | null,
  sort: SortState,
): RaceResultDto[] {
  const filtered =
    categoryFilter === null
      ? [...results]
      : results.filter((result) => result.athlete.category === categoryFilter)

  return filtered.sort((a, b) => compareResults(a, b, sort))
}

function getAriaSort(column: ColumnDef, sort: SortState): 'ascending' | 'descending' | 'none' {
  if (!column.sortKey || column.sortKey !== sort.key) return 'none'
  return sort.dir === 'asc' ? 'ascending' : 'descending'
}

export const AthleteLeaderboard = ({ results, categoryFilter }: AthleteLeaderboardProps) => {
  const [sort, setSort] = useState<SortState>({ key: 'overallPosition', dir: 'asc' })

  const handleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  const rows = getDisplayRows(results, categoryFilter, sort)
  const sortedColumn = COLUMNS.find((column) => column.sortKey === sort.key)
  const sortAnnouncement = sortedColumn
    ? `Sorted by ${sortedColumn.label}, ${sort.dir === 'asc' ? 'ascending' : 'descending'}.`
    : ''

  return (
    <>
      <p className={styles.visuallyHidden} aria-live="polite">
        {sortAnnouncement}
      </p>
      <table className={styles.table}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.label}
                className={`${styles.cell} ${styles.th} ${column.widthClass}`}
                aria-sort={column.sortKey ? getAriaSort(column, sort) : undefined}
              >
                {column.sortKey ? (
                  <button
                    type="button"
                    className={styles.sortBtn}
                    onClick={() => handleSort(column.sortKey as SortKey)}
                  >
                    {column.label}
                    {column.sortKey === sort.key && (
                      <span className={styles.sortIndicator} aria-hidden="true">
                        {sort.dir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </button>
                ) : (
                  column.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className={styles.emptyCell} colSpan={COLUMNS.length}>
                <EmptyState title="No results" />
              </td>
            </tr>
          ) : (
            rows.map((result) => (
              <tr key={result.id}>
                <td className={`${styles.cell} ${styles.colPosition}`}>
                  {result.overallPosition ?? NOT_AVAILABLE}
                </td>
                <td className={`${styles.cell} ${styles.colName}`}>
                  {result.athlete.firstName} {result.athlete.lastName}
                </td>
                <td className={`${styles.cell} ${styles.colCategory}`}>
                  <Badge label={result.athlete.category} variant={result.athlete.category} />
                </td>
                <td className={`${styles.cell} ${styles.colTime}`}>{getFinishTimeCell(result)}</td>
                <td className={`${styles.cell} ${styles.colPlace}`}>
                  {result.overallPosition ?? NOT_AVAILABLE}
                </td>
                <td className={`${styles.cell} ${styles.colPlace}`}>
                  {result.categoryPosition ?? NOT_AVAILABLE}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  )
}