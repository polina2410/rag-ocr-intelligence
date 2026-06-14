import { Logger } from '@nestjs/common';
import type { Response } from 'express';
import {
  SSE_DONE_PAYLOAD,
  SSE_SAFE_ERROR_MESSAGE,
} from './sse-stream.constants.js';
import { writeSse } from './sse-stream.js';

interface Harness {
  res: Response;
  setHeaderFn: jest.Mock;
  flushHeadersFn: jest.Mock;
  writeFn: jest.Mock;
  endFn: jest.Mock;
  closeHandlers: Array<() => void>;
}

const setup = (): Harness => {
  const closeHandlers: Array<() => void> = [];
  const setHeaderFn = jest.fn();
  const flushHeadersFn = jest.fn();
  const writeFn = jest.fn();
  const endFn = jest.fn();
  const onFn = jest.fn((event: string, handler: () => void) => {
    if (event === 'close') {
      closeHandlers.push(handler);
    }
  });
  const res = {
    setHeader: setHeaderFn,
    flushHeaders: flushHeadersFn,
    write: writeFn,
    end: endFn,
    on: onFn,
    writableEnded: false,
  } as unknown as Response;
  return { res, setHeaderFn, flushHeadersFn, writeFn, endFn, closeHandlers };
};

async function* tokenStream(tokens: string[]): AsyncGenerator<string> {
  for (const token of tokens) {
    await Promise.resolve();
    yield token;
  }
}

async function* throwingStream(
  tokens: string[],
  error: Error,
): AsyncGenerator<string> {
  for (const token of tokens) {
    await Promise.resolve();
    yield token;
  }
  throw error;
}

const DONE_FRAME = `event: done\ndata: ${SSE_DONE_PAYLOAD}\n\n`;
const dataFrameFor = (token: string): string =>
  `data: ${JSON.stringify(token)}\n\n`;

describe('writeSse', () => {
  it('sets all SSE headers and flushes before writing any data frame', async () => {
    const { res, setHeaderFn, flushHeadersFn, writeFn } = setup();

    await writeSse(res, tokenStream(['x']));

    expect(setHeaderFn).toHaveBeenCalledWith(
      'Content-Type',
      'text/event-stream',
    );
    expect(setHeaderFn).toHaveBeenCalledTimes(4);
    expect(flushHeadersFn).toHaveBeenCalledTimes(1);
    expect(flushHeadersFn.mock.invocationCallOrder[0]).toBeLessThan(
      writeFn.mock.invocationCallOrder[0],
    );
  });

  it('writes each token as an ordered JSON-encoded data frame', async () => {
    const { res, writeFn } = setup();

    await writeSse(res, tokenStream(['Hello', 'line\nbreak', 'quote"x']));

    expect(writeFn).toHaveBeenNthCalledWith(1, dataFrameFor('Hello'));
    expect(writeFn).toHaveBeenNthCalledWith(2, dataFrameFor('line\nbreak'));
    expect(writeFn).toHaveBeenNthCalledWith(3, dataFrameFor('quote"x'));
  });

  it('writes the done event and ends the response once on completion', async () => {
    const { res, writeFn, endFn } = setup();

    await writeSse(res, tokenStream(['a']));

    expect(writeFn).toHaveBeenCalledWith(DONE_FRAME);
    expect(endFn).toHaveBeenCalledTimes(1);
  });

  it('emits only headers, done, and end for an empty stream', async () => {
    const { res, flushHeadersFn, writeFn, endFn } = setup();

    await writeSse(res, tokenStream([]));

    expect(flushHeadersFn).toHaveBeenCalledTimes(1);
    expect(writeFn).toHaveBeenCalledTimes(1);
    expect(writeFn).toHaveBeenCalledWith(DONE_FRAME);
    expect(endFn).toHaveBeenCalledTimes(1);
  });

  it('logs the error, emits a safe error frame, ends, and never throws', async () => {
    const { res, writeFn, endFn } = setup();
    const error = new Error('OpenAI exploded: secret detail');
    const logSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    await expect(
      writeSse(res, throwingStream(['partial'], error)),
    ).resolves.toBeUndefined();

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(writeFn).toHaveBeenCalledWith(
      `event: error\ndata: ${JSON.stringify(SSE_SAFE_ERROR_MESSAGE)}\n\n`,
    );
    expect(writeFn).not.toHaveBeenCalledWith(
      expect.stringContaining('secret detail'),
    );
    expect(writeFn).not.toHaveBeenCalledWith(DONE_FRAME);
    expect(endFn).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
  });

  it('stops writing when the client disconnects mid-stream', async () => {
    const { res, writeFn, endFn, closeHandlers } = setup();

    async function* closingStream(): AsyncGenerator<string> {
      await Promise.resolve();
      yield 'first';
      closeHandlers.forEach((handler) => handler());
      await Promise.resolve();
      yield 'second';
    }

    await writeSse(res, closingStream());

    expect(writeFn).toHaveBeenCalledWith(dataFrameFor('first'));
    expect(writeFn).not.toHaveBeenCalledWith(dataFrameFor('second'));
    expect(writeFn).not.toHaveBeenCalledWith(DONE_FRAME);
    expect(endFn).not.toHaveBeenCalled();
  });

  it('invokes onClose once when the client disconnects mid-stream', async () => {
    const { res, closeHandlers } = setup();
    const onCloseFn = jest.fn();

    async function* closingStream(): AsyncGenerator<string> {
      await Promise.resolve();
      yield 'first';
      closeHandlers.forEach((handler) => handler());
      await Promise.resolve();
      yield 'second';
    }

    await writeSse(res, closingStream(), onCloseFn);

    expect(onCloseFn).toHaveBeenCalledTimes(1);
  });

  it('does not invoke onClose when close fires after normal completion', async () => {
    const { res, closeHandlers } = setup();
    const onCloseFn = jest.fn();

    await writeSse(res, tokenStream(['a']), onCloseFn);
    // the OS emits 'close' after the response has already ended normally
    closeHandlers.forEach((handler) => handler());

    expect(onCloseFn).not.toHaveBeenCalled();
  });
});
