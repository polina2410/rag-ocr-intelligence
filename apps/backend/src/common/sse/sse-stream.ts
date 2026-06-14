import { Logger } from '@nestjs/common';
import type { Response } from 'express';
import {
  RESPONSE_CLOSE_EVENT,
  SSE_DATA_FIELD,
  SSE_DONE_EVENT,
  SSE_DONE_PAYLOAD,
  SSE_ERROR_EVENT,
  SSE_EVENT_FIELD,
  SSE_FRAME_TERMINATOR,
  SSE_HEADERS,
  SSE_LINE_TERMINATOR,
  SSE_SAFE_ERROR_MESSAGE,
} from './sse-stream.constants.js';

const logger = new Logger('writeSse');

const dataFrame = (payload: string): string =>
  `${SSE_DATA_FIELD}${payload}${SSE_FRAME_TERMINATOR}`;

const eventFrame = (event: string, payload: string): string =>
  `${SSE_EVENT_FIELD}${event}${SSE_LINE_TERMINATOR}${SSE_DATA_FIELD}${payload}${SSE_FRAME_TERMINATOR}`;

/**
 * Pipes an async stream of string tokens to an Express response as Server-Sent
 * Events. Each token is JSON-encoded into a `data:` frame; completion emits a
 * terminal `done` event; a mid-stream failure logs the full error server-side
 * and emits a generic `error` event without leaking internals. If the client
 * disconnects, iteration stops so the upstream generator's cleanup runs.
 *
 * Decoupled from the LLM layer — generic over any `AsyncIterable<string>`.
 * Resolves normally even on error (the response is already committed once
 * streaming has begun, so there is nothing to rethrow to).
 *
 * `onClose` fires once if the client disconnects BEFORE the stream finishes
 * (not on normal completion). Callers wire it to an `AbortController` so the
 * upstream producer (e.g. an in-flight OpenAI request) is cancelled immediately
 * rather than at the next token boundary.
 */
export async function writeSse(
  res: Response,
  tokens: AsyncIterable<string>,
  onClose?: () => void,
): Promise<void> {
  let closed = false;
  let ended = false;
  res.on(RESPONSE_CLOSE_EVENT, () => {
    closed = true;
    if (!ended) {
      onClose?.();
    }
  });

  const canWrite = (): boolean => !closed && !ended && !res.writableEnded;
  const safeWrite = (frame: string): void => {
    if (canWrite()) {
      res.write(frame);
    }
  };
  const safeEnd = (): void => {
    if (canWrite()) {
      ended = true;
      res.end();
    }
  };

  for (const [header, value] of Object.entries(SSE_HEADERS)) {
    res.setHeader(header, value);
  }
  res.flushHeaders();

  try {
    for await (const token of tokens) {
      if (closed) {
        break;
      }
      safeWrite(dataFrame(JSON.stringify(token)));
    }
    safeWrite(eventFrame(SSE_DONE_EVENT, SSE_DONE_PAYLOAD));
    safeEnd();
  } catch (error: unknown) {
    logger.error(
      'SSE stream failed',
      error instanceof Error ? error.stack : String(error),
    );
    safeWrite(
      eventFrame(SSE_ERROR_EVENT, JSON.stringify(SSE_SAFE_ERROR_MESSAGE)),
    );
    safeEnd();
  } finally {
    // Guarantees the response is closed even if the catch block itself throws.
    safeEnd();
  }
}
