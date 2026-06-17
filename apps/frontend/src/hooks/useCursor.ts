import { useContext } from 'react'
import { CursorContext } from '../context/CursorContext'
import type { CursorContextValue } from '../context/CursorContext'

export const useCursor = (): CursorContextValue => useContext(CursorContext)
