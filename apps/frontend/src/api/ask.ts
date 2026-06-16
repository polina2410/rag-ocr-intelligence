const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const DATA_PREFIX = 'data: '
const EVENT_PREFIX = 'event: '
const DONE_EVENT = 'done'
const ERROR_EVENT = 'error'

export interface StreamAskCallbacks {
  onToken: (token: string) => void
  onDone: () => void
  onError: (message: string) => void
}

interface SseFrame {
  event: string | null
  data: string
}

const parseFrame = (frame: string): SseFrame => {
  let event: string | null = null
  let data = ''

  for (const line of frame.split('\n')) {
    if (line.startsWith(EVENT_PREFIX)) {
      event = line.slice(EVENT_PREFIX.length)
    } else if (line.startsWith(DATA_PREFIX)) {
      data = line.slice(DATA_PREFIX.length)
    }
  }

  return { event, data }
}

const parseStringPayload = (data: string): string | null => {
  try {
    const parsed = JSON.parse(data)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
}

const handleFrame = (frame: string, callbacks: StreamAskCallbacks): boolean => {
  const { event, data } = parseFrame(frame)

  if (event === DONE_EVENT) {
    callbacks.onDone()
    return true
  }

  if (event === ERROR_EVENT) {
    callbacks.onError(parseStringPayload(data) ?? 'Stream failed')
    return true
  }

  if (data) {
    const token = parseStringPayload(data)
    if (token !== null) {
      callbacks.onToken(token)
    }
  }

  return false
}

export const streamAsk = async (
  query: string,
  signal: AbortSignal,
  callbacks: StreamAskCallbacks,
): Promise<void> => {
  let response: Response
  try {
    response = await fetch(`${API_URL}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    callbacks.onError('Stream failed')
    return
  }

  if (!response.ok) {
    callbacks.onError('Stream failed')
    return
  }

  if (!response.body) {
    callbacks.onError('Stream failed')
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split('\n\n')
      buffer = frames.pop() ?? ''

      for (const frame of frames) {
        if (handleFrame(frame, callbacks)) {
          return
        }
      }
    }

    if (buffer && handleFrame(buffer, callbacks)) {
      return
    }
    callbacks.onDone()
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return
    }
    callbacks.onError('Stream failed')
  }
}