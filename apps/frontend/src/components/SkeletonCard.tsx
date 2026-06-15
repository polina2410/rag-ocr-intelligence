import styles from './SkeletonCard.module.css'

export const SkeletonCard = () => (
  <div className={styles.card}>
    <div className={`${styles.title} ${styles.shimmer}`} />
    <div className={`${styles.badge} ${styles.shimmer}`} />
    <div className={styles.divider} />
    <div className={`${styles.line} ${styles.shimmer}`} />
    <div className={`${styles.line} ${styles.shimmer}`} />
  </div>
)