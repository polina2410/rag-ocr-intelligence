import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { ErrorBoundary } from './ErrorBoundary'
import { RouteFallback } from './RouteFallback'
import styles from './RootLayout.module.css'

export const RootLayout = () => (
  <div className={styles.layout}>
    <header className={styles.header}>ocr-intelligence</header>
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  </div>
)