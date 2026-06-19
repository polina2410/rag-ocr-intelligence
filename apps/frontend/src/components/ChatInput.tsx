import { useState } from 'react'
import styles from './ChatInput.module.css'

export interface ChatInputProps {
  onSubmit: (query: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput = ({ onSubmit, disabled = false, placeholder = 'Ask a question about the race data…' }: ChatInputProps) => {
  const [draft, setDraft] = useState('')

  const handleAction = (formData: FormData) => {
    const trimmed = (formData.get('chat-input') as string).trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setDraft('')
  }

  const isSubmitDisabled = disabled || draft.trim().length === 0

  return (
    <form className={styles.form} action={handleAction}>
      <label htmlFor="chat-input-field" className={styles.visuallyHidden}>
        {placeholder}
      </label>
      <input
        id="chat-input-field"
        name="chat-input"
        type="text"
        className={styles.input}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={1000}
      />
      <button type="submit" className={styles.button} disabled={isSubmitDisabled}>
        Send
      </button>
    </form>
  )
}