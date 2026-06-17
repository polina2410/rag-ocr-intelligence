import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import styles from './RacesHero.module.css'

const SCROLL_OFFSET_START = 'start start'
const SCROLL_OFFSET_END = 'end start'
const BG_TRAVEL_PX = 80
const FG_TRAVEL_PX = -40

export const RacesHero = () => {
  const ref = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [SCROLL_OFFSET_START, SCROLL_OFFSET_END],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : BG_TRAVEL_PX])
  const fgY = useTransform(scrollYProgress, [0, 1], [0, prefersReducedMotion ? 0 : FG_TRAVEL_PX])

  return (
    <section ref={ref} className={styles.hero} aria-label="Races hero">
      <motion.div className={styles.background} aria-hidden="true" style={{ y: bgY }} />
      <motion.div className={styles.foreground} style={{ y: fgY }}>
        <h1 className={styles.heading}>Races</h1>
      </motion.div>
    </section>
  )
}
