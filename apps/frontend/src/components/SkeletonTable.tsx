import styles from './SkeletonTable.module.css'

const DEFAULT_ROWS = 5

const COLUMNS = [
  styles.colPosition,
  styles.colName,
  styles.colCategory,
  styles.colTime,
  styles.colPlace,
  styles.colPlace,
]

export const SkeletonTable = ({ rows }: { rows?: number }) => (
  <table className={styles.table}>
    <thead>
      <tr>
        {COLUMNS.map((colClass, i) => (
          <th key={i} className={styles.cell}>
            <span className={`${colClass} ${styles.headerShimmer} ${styles.shimmer}`} />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows ?? DEFAULT_ROWS }, (_, i) => (
        <tr key={i}>
          {COLUMNS.map((colClass, j) => (
            <td key={j} className={styles.cell}>
              <span className={`${colClass} ${styles.bodyShimmer} ${styles.shimmer}`} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)