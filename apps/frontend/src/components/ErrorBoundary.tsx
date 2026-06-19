import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const normalized = error instanceof Error ? error : new Error(String(error))
    return { hasError: true, error: normalized }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => {
    window.location.reload()
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback } = this.props

    if (!hasError || !error) return children

    if (fallback) return fallback(error, this.reset)

    return (
      <div className={styles.container}>
        <p className={styles.message}>{error.message || 'Something went wrong.'}</p>
        <button className={styles.button} onClick={this.reset}>
          Try again
        </button>
      </div>
    )
  }
}