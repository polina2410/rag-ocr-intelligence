import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react'
import styles from './DropZone.module.css'

export interface DropZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
}

const isValidCsv = (file: File): boolean =>
  file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'

export const DropZone = ({ onFile, disabled = false }: DropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateAndEmit = (file: File | undefined) => {
    if (!file) return
    if (isValidCsv(file)) {
      setError(null)
      onFile(file)
    } else {
      setError('Please select a CSV file.')
    }
  }

  const openPicker = () => {
    if (disabled) return
    setError(null)
    inputRef.current?.click()
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (disabled) return
    setDragOver(true)
    setError(null)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled) return
    validateAndEmit(e.dataTransfer.files[0])
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    validateAndEmit(e.target.files?.[0])
    e.target.value = ''
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      openPicker()
    }
  }

  const zoneClass = [
    styles.zone,
    dragOver && styles.zoneDragOver,
    disabled && styles.zoneDisabled,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      role="button"
      aria-label="Upload a CSV file"
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={zoneClass}
      onClick={openPicker}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <p className={styles.prompt}>Drag a CSV file here, or click to select</p>
      {error && <p className={styles.error}>{error}</p>}
      <label htmlFor="drop-zone-input" className={styles.visuallyHidden}>
        Upload CSV file
      </label>
      <input
        id="drop-zone-input"
        ref={inputRef}
        type="file"
        accept=".csv"
        className={styles.visuallyHidden}
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  )
}