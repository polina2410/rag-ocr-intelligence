export const SSE_HEADERS: Record<string, string> = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

export const SSE_DATA_FIELD = 'data: ';
export const SSE_EVENT_FIELD = 'event: ';
export const SSE_LINE_TERMINATOR = '\n';
export const SSE_FRAME_TERMINATOR = '\n\n';

export const SSE_DONE_EVENT = 'done';
export const SSE_DONE_PAYLOAD = '[DONE]';

export const SSE_ERROR_EVENT = 'error';
export const SSE_SAFE_ERROR_MESSAGE = 'Stream failed';

export const RESPONSE_CLOSE_EVENT = 'close';
