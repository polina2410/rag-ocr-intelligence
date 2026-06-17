import { motion } from 'framer-motion'
import type { CursorMode } from '../context/CursorContext'
import { useCursor } from '../hooks/useCursor'
import styles from './CursorDot.module.css'

const DOT_SIZE = 10
const RING_SIZE = 20
const RING_BORDER = 2
const TRANSITION_DURATION = 0.15
const FULL_RADIUS = 9999

type ShapeTarget = {
  width: number
  height: number
  borderRadius: number
  backgroundColor: string
  borderWidth: number
  borderColor: string
  opacity: number
}

const SHAPES: Record<CursorMode, ShapeTarget> = {
  default: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: FULL_RADIUS,
    backgroundColor: 'var(--color-accent)',
    borderWidth: 0,
    borderColor: 'var(--color-accent)',
    opacity: 1,
  },
  hover: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: FULL_RADIUS,
    backgroundColor: 'var(--color-accent)',
    borderWidth: 0,
    borderColor: 'var(--color-accent)',
    opacity: 1,
  },
  pointer: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: FULL_RADIUS,
    backgroundColor: 'transparent',
    borderWidth: RING_BORDER,
    borderColor: 'var(--color-accent)',
    opacity: 1,
  },
}

export const CursorDot = () => {
  const { x, y, mode } = useCursor()

  return (
    <motion.div
      className={styles.dot}
      style={{ left: x, top: y }}
      animate={SHAPES[mode]}
      transition={{ duration: TRANSITION_DURATION, ease: 'easeOut' }}
    />
  )
}
