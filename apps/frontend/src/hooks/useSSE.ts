import { useCallback, useEffect, useRef, useState } from 'react'
import { streamAsk } from '../api/ask'

export interface UseSSEResult {
  text: string
  isStreaming: boolean
  error: string | null
  start: (query: string) => void
  stop: () => void
}

export const useSSE = (): UseSSEResult => {
  const [text, setText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    setIsStreaming(false)
  }, [])

  const start = useCallback((query: string) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    const isCurrent = (): boolean => controllerRef.current === controller

    setText('')
    setError(null)
    setIsStreaming(true)

    void streamAsk(query, controller.signal, {
      onToken: (token) => {
        if (isCurrent()) {
          setText((prev) => prev + token)
        }
      },
      onDone: () => {
        if (isCurrent()) {
          setIsStreaming(false)
        }
      },
      onError: (message) => {
        if (isCurrent()) {
          setError(message)
          setIsStreaming(false)
        }
      },
    }).catch(() => {
      if (isCurrent()) {
        setError('Stream failed')
        setIsStreaming(false)
      }
    })
  }, [])

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
    }
  }, [])

  return { text, isStreaming, error, start, stop }
}