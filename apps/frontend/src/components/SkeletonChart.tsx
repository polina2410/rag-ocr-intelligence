import styles from './SkeletonChart.module.css'

const DEFAULT_BARS = 8

export const SkeletonChart = ({ bars }: { bars?: number }) => {
  const count = bars ?? DEFAULT_BARS
  const rows = Array.from({ length: count }, (_, i) => i)

  return (
    <div className={styles.root}>
      <div className={`${styles.title} ${styles.shimmer}`} />
      <div className={styles.chartArea}>
        <div className={styles.leftCol}>
          {rows.map((i) => (
            <div key={i} className={`${styles.label} ${styles.shimmer}`} />
          ))}
        </div>
        <div className={styles.rightCol}>
          {rows.map((i) => (
            <div key={i} className={`${styles.bar} ${styles.shimmer}`} />
          ))}
          <div className={`${styles.axis} ${styles.shimmer}`} />
        </div>
      </div>
    </div>
  )
}