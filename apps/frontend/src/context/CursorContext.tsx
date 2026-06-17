/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type CursorMode = 'default' | 'hover' | 'pointer'

export interface CursorContextValue {
  x: number
  y: number
  hint: string | null
  mode: CursorMode
}

const INTERACTIVE_SELECTOR = 'a, button, [role="button"], [tabindex]'
const CURSOR_HINT_ATTR = 'data-cursor-hint'
const CURSOR_MAGNIFIER_ATTR = 'data-cursor-magnifier'

const DEFAULT_VALUE: CursorContextValue = { x: 0, y: 0, hint: null, mode: 'default' }

export const CursorContext = createContext<CursorContextValue>(DEFAULT_VALUE)

export const CursorProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<CursorContextValue>(DEFAULT_VALUE)

  const handleMouseMove = useCallback((event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) {
      setState({ x: event.clientX, y: event.clientY, hint: null, mode: 'default' })
      return
    }
    const hint = target.closest(`[${CURSOR_HINT_ATTR}]`)?.getAttribute(CURSOR_HINT_ATTR) ?? null
    const mode: CursorMode = target.closest(`[${CURSOR_MAGNIFIER_ATTR}]`)
      ? 'hover'
      : target.closest(INTERACTIVE_SELECTOR)
        ? 'pointer'
        : 'default'
    setState({ x: event.clientX, y: event.clientY, hint, mode })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return <CursorContext.Provider value={state}>{children}</CursorContext.Provider>
}
