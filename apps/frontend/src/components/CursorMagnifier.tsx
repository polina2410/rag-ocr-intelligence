import { useEffect, useRef } from 'react'
import html2canvas from 'html2canvas-pro'
import { useCursor } from '../hooks/useCursor'
import styles from './CursorMagnifier.module.css'

const CANVAS_SIZE = 200
const SRC_SIZE = 100
const OFFSET = 20

export const CursorMagnifier = () => {
  const { x, y, mode } = useCursor()
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const snapshotRef = useRef<HTMLCanvasElement | null>(null)
  const prevModeRef = useRef<string>(mode)

  // Capture snapshot on transition into 'hover'
  useEffect(() => {
    const wasHover = prevModeRef.current === 'hover'
    const isHover = mode === 'hover'
    prevModeRef.current = mode

    if (!wasHover && isHover) {
      let cancelled = false
      html2canvas(document.body, { scale: 1, useCORS: true }).then((snapshot) => {
        if (cancelled) return
        snapshotRef.current = snapshot
      })
      return () => {
        cancelled = true
      }
    }

    if (wasHover && !isHover) {
      snapshotRef.current = null
    }
  }, [mode])

  // Redraw crop on position change while hovering
  useEffect(() => {
    if (mode !== 'hover') return
    const canvas = canvasRef.current
    const snapshot = snapshotRef.current
    if (!canvas || !snapshot) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const srcX = Math.max(0, Math.min(x + window.scrollX - SRC_SIZE / 2, snapshot.width - SRC_SIZE))
    const srcY = Math.max(0, Math.min(y + window.scrollY - SRC_SIZE / 2, snapshot.height - SRC_SIZE))

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
    ctx.drawImage(snapshot, srcX, srcY, SRC_SIZE, SRC_SIZE, 0, 0, CANVAS_SIZE, CANVAS_SIZE)
  }, [x, y, mode])

  if (mode !== 'hover') return null

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{ left: x + OFFSET, top: y - CANVAS_SIZE - OFFSET }}
    />
  )
}
