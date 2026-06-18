import styles from './RouteFallback.module.css'

export const RouteFallback = () => (
  <div className={styles.wrapper} role="status" aria-label="Loading page">
    <div className={styles.spinner} />
  </div>
)