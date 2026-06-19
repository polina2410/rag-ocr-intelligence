import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import styles from './ConfirmDialog.module.css'

const BACKDROP_DURATION = 0.18
const PANEL_DURATION = 0.22
const PANEL_OFFSET_Y = 12
const PANEL_SCALE_FROM = 0.96

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  isPending?: boolean
  errorMessage?: string | null
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDialog = ({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  isPending = false,
  errorMessage = null,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const shouldReduceMotion = useReducedMotion()
  const titleId = useId()
  const descId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Remember the element that opened the dialog so focus can be restored on close.
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement as HTMLElement | null
    } else {
      triggerRef.current?.focus?.()
    }
  }, [open])

  // Move focus to the safe (Cancel) action when the dialog opens.
  useEffect(() => {
    if (open) cancelRef.current?.focus()
  }, [open])

  // Lock background scroll while the dialog is open.
  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  // Close on Escape and keep Tab focus trapped within the panel.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (!isPending) onCancel()
        return
      }

      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isPending, onCancel])

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: BACKDROP_DURATION }}
          onClick={() => {
            if (!isPending) onCancel()
          }}
        >
          <motion.div
            ref={panelRef}
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            initial={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : PANEL_OFFSET_Y,
              scale: shouldReduceMotion ? 1 : PANEL_SCALE_FROM,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: shouldReduceMotion ? 0 : PANEL_OFFSET_Y,
              scale: shouldReduceMotion ? 1 : PANEL_SCALE_FROM,
            }}
            transition={{ duration: PANEL_DURATION, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={tone === 'danger' ? styles.icon_danger : styles.icon_default} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </div>

            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            <div id={descId} className={styles.message}>
              {message}
            </div>

            {errorMessage && (
              <p role="alert" className={styles.error}>
                {errorMessage}
              </p>
            )}

            <div className={styles.actions}>
              <button
                ref={cancelRef}
                type="button"
                className={styles.cancel}
                onClick={onCancel}
                disabled={isPending}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className={tone === 'danger' ? styles.confirm_danger : styles.confirm_default}
                onClick={onConfirm}
                disabled={isPending}
                aria-busy={isPending}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
