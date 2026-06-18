import { type ReactNode } from 'react'
import styles from './PageWrapper.module.css'

export const PageWrapper = ({ children }: { children: ReactNode }) => (
  <main className={styles.wrapper}>{children}</main>
)