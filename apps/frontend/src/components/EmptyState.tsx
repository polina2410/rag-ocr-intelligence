import type { ReactNode } from 'react'
import styles from './EmptyState.module.css'

export interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className={styles.root}>
    {icon !== undefined && <div className={styles.icon}>{icon}</div>}
    <p className={styles.title}>{title}</p>
    {description !== undefined && <p className={styles.description}>{description}</p>}
    {action !== undefined && <div className={styles.action}>{action}</div>}
  </div>
)
