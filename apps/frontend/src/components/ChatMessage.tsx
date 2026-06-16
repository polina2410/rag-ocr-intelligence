import styles from './ChatMessage.module.css'

export interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
}

export const ChatMessage = ({ role, content, isStreaming = false }: ChatMessageProps) => {
  const rowClass = role === 'user' ? styles.rowUser : styles.rowAssistant
  const bubbleClass = role === 'user' ? styles.bubbleUser : styles.bubbleAssistant

  return (
    <div className={`${styles.row} ${rowClass}`}>
      <div className={`${styles.bubble} ${bubbleClass}`}>
        {content}
        {isStreaming && <span className={styles.cursor} aria-hidden="true">▍</span>}
      </div>
    </div>
  )
}