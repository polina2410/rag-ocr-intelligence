import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { CursorProvider } from '../context/CursorContext'
import { CursorDot } from './CursorDot'
import { CursorHint } from './CursorHint'
import { ErrorBoundary } from './ErrorBoundary'
import { Navbar } from './Navbar'
import { RouteFallback } from './RouteFallback'
import styles from './RootLayout.module.css'

export const RootLayout = () => (
  <div className={styles.layout}>
    <CursorProvider>
      <CursorDot />
      <CursorHint />
      <Navbar />
      <ErrorBoundary>
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </CursorProvider>
  </div>
)