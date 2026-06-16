import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import styles from './ChatInput.module.css'

export interface ChatInputProps {
  onSubmit: (query: string) => void
  disabled?: boolean
  placeholder?: string
}

export const ChatInput = ({ onSubmit, disabled = false, placeholder = 'Ask a question about the race data…' }: ChatInputProps) => {
  const [draft, setDraft] = useState('')

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDraft(event.target.value)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) {
      return
    }
    onSubmit(trimmed)
    setDraft('')
  }

  const isSubmitDisabled = disabled || draft.trim().length === 0

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label htmlFor="chat-input-field" className={styles.visuallyHidden}>
        {placeholder}
      </label>
      <input
        id="chat-input-field"
        type="text"
        className={styles.input}
        value={draft}
        onChange={handleChange}
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