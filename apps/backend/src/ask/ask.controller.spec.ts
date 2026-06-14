import type { Response } from 'express';
import type OpenAI from 'openai';
import { writeSse } from '../common/sse/sse-stream.js';
import type { GenerateService } from '../generate/generate.service.js';
import type { PromptBuilderService } from '../prompt/prompt-builder.service.js';
import type {
  RetrievedChunk,
  RetrieveService,
} from '../retrieve/retrieve.service.js';
import { AskController } from './ask.controller.js';

jest.mock('../common/sse/sse-stream.js', () => ({
  writeSse: jest.fn(),
}));

const writeSseMock = writeSse as jest.MockedFunction<typeof writeSse>;

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const makeChunk = (text: string): RetrievedChunk => ({
  id: 'rr-1',
  score: 0.9,
  metadata: {
    raceResultId: 'rr-1',
    raceId: 'race-1',
    athleteId: 'athlete-1',
    athleteName: 'Jane Smith',
    raceName: 'OCR Champ',
    raceDate: '2026-05-10',
    text,
  },
});

async function* fakeStream(): AsyncGenerator<string> {
  await Promise.resolve();
  yield 'token';
}

interface Harness {
  controller: AskController;
  retrieveFn: jest.Mock;
  buildMessagesFn: jest.Mock;
  generateFn: jest.Mock;
  generator: AsyncGenerator<string>;
  messages: ChatMessage[];
  res: Response;
}

const setup = (
  options: { chunks?: RetrievedChunk[]; retrieveError?: Error } = {},
): Harness => {
  const { chunks = [], retrieveError } = options;
  const messages: ChatMessage[] = [
    { role: 'system', content: 'system' },
    { role: 'user', content: 'user' },
  ];
  const generator = fakeStream();

  const retrieveFn = retrieveError
    ? jest.fn().mockRejectedValue(retrieveError)
    : jest.fn().mockResolvedValue(chunks);
  const buildMessagesFn = jest.fn().mockReturnValue(messages);
  const generateFn = jest.fn().mockReturnValue(generator);

  const retrieve = { retrieve: retrieveFn } as unknown as RetrieveService;
  const promptBuilder = {
    buildMessages: buildMessagesFn,
  } as unknown as PromptBuilderService;
  const generate = { generate: generateFn } as unknown as GenerateService;

  const controller = new AskController(retrieve, promptBuilder, generate);
  const res = {} as unknown as Response;
  return {
    controller,
    retrieveFn,
    buildMessagesFn,
    generateFn,
    generator,
    messages,
    res,
  };
};

describe('AskController', () => {
  beforeEach(() => {
    writeSseMock.mockReset();
    writeSseMock.mockResolvedValue(undefined);
  });

  it('retrieves chunks for the query', async () => {
    const { controller, retrieveFn, res } = setup();

    await controller.ask({ query: 'who won?' }, res);

    expect(retrieveFn).toHaveBeenCalledWith('who won?');
  });

  it('builds messages from the query and retrieved chunks', async () => {
    const chunks = [makeChunk('context text')];
    const { controller, buildMessagesFn, res } = setup({ chunks });

    await controller.ask({ query: 'q' }, res);

    expect(buildMessagesFn).toHaveBeenCalledWith('q', chunks);
  });

  it('generates with the built messages and an abort signal', async () => {
    const { controller, generateFn, messages, res } = setup();

    await controller.ask({ query: 'q' }, res);

    expect(generateFn).toHaveBeenCalledWith(messages, expect.any(AbortSignal));
  });

  it('streams the generator to the response via writeSse with an onClose handler', async () => {
    const { controller, generator, res } = setup();

    await controller.ask({ query: 'q' }, res);

    expect(writeSseMock).toHaveBeenCalledWith(
      res,
      generator,
      expect.any(Function),
    );
  });

  it('propagates a retrieval error before streaming and never calls writeSse', async () => {
    const error = new Error('embeddings unavailable');
    const { controller, res } = setup({ retrieveError: error });

    await expect(controller.ask({ query: 'q' }, res)).rejects.toBe(error);
    expect(writeSseMock).not.toHaveBeenCalled();
  });
});
