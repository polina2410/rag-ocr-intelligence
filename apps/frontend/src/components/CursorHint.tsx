import { AnimatePresence, motion } from 'framer-motion'
import { useCursor } from '../hooks/useCursor'
import styles from './CursorHint.module.css'

const HINT_OFFSET_X = 16
const HINT_OFFSET_Y = 8
const HINT_TRANSITION_DURATION = 0.15

export const CursorHint = () => {
  const { x, y, hint } = useCursor()

  return (
    <AnimatePresence>
      {hint && (
        <motion.div
          className={styles.hint}
          style={{ left: x + HINT_OFFSET_X, top: y + HINT_OFFSET_Y }}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: HINT_TRANSITION_DURATION }}
        >
          {hint}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
