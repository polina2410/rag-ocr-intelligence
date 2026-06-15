import styles from './Badge.module.css'

export interface BadgeProps {
  label: string
  variant: string
}

export const Badge = ({ label, variant }: BadgeProps) => (
  <span className={styles.badge} data-variant={variant}>
    {label}
  </span>
)