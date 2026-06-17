import { useEffect, useRef } from 'react'
import styles from './ChatHistory.module.css'
import { ChatMessage } from './ChatMessage'
import { SourceCitations, type Citation } from './SourceCitations'

export interface ChatHistoryMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  citations?: Citation[]
}

export interface ChatHistoryProps {
  messages: ChatHistoryMessage[]
}

export const ChatHistory = ({ messages }: ChatHistoryProps) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  return (
    <div className={styles.scroll}>
      {messages.map((message) => (
        <div key={message.id} className={styles.entry}>
          <ChatMessage
            role={message.role}
            content={message.content}
            isStreaming={message.isStreaming}
          />
          {message.citations && message.citations.length > 0 && (
            <SourceCitations citations={message.citations} />
          )}
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}