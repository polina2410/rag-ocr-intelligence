import { useEffect, useRef, useState } from 'react'
import { ChatHistory } from '../components/ChatHistory'
import type { ChatHistoryMessage } from '../components/ChatHistory'
import { ChatInput } from '../components/ChatInput'
import { EmptyState } from '../components/EmptyState'
import { useSSE } from '../hooks/useSSE'
import styles from './AskPage.module.css'

const AskPage = () => {
  const [messages, setMessages] = useState<ChatHistoryMessage[]>([])
  const { text, isStreaming, error, start } = useSSE()
  const currentAssistantIdRef = useRef<string | null>(null)

  const handleSubmit = (query: string) => {
    const userId = crypto.randomUUID()
    const assistantId = crypto.randomUUID()
    currentAssistantIdRef.current = assistantId
    setMessages((prev) => [
      ...prev,
      { id: userId, role: 'user', content: query },
      { id: assistantId, role: 'assistant', content: '', isStreaming: true },
    ])
    start(query)
  }

  useEffect(() => {
    const id = currentAssistantIdRef.current
    if (!id) return
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content: text } : m)),
    )
  }, [text])

  useEffect(() => {
    if (!isStreaming && currentAssistantIdRef.current) {
      const id = currentAssistantIdRef.current
      currentAssistantIdRef.current = null
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, isStreaming: false } : m)),
      )
    }
  }, [isStreaming])

  return (
    <div className={styles.page}>
      <div className={styles.history}>
        {messages.length === 0 && !isStreaming ? (
          <EmptyState
            title="Ask anything about the races"
            description="Your answer will stream in below."
          />
        ) : (
          <ChatHistory messages={messages} />
        )}
      </div>
      <div className={styles.inputArea}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
      </div>
    </div>
  )
}

export default AskPage