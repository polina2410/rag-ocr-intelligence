import type OpenAI from 'openai';
import { CHAT_MODEL } from './generate.constants.js';
import { GenerateService } from './generate.service.js';

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam;

const messages: ChatMessage[] = [
  { role: 'system', content: 'system instruction' },
  { role: 'user', content: 'who won?' },
];

type ChatChunk = OpenAI.Chat.Completions.ChatCompletionChunk;

const chunkOf = (content: string | null | undefined): ChatChunk => ({
  id: 'chunk-1',
  created: 0,
  model: CHAT_MODEL,
  object: 'chat.completion.chunk',
  choices: [{ index: 0, delta: { content }, finish_reason: null }],
});

async function* streamFrom(chunks: ChatChunk[]): AsyncGenerator<ChatChunk> {
  for (const chunk of chunks) {
    await Promise.resolve();
    yield chunk;
  }
}

async function* throwingStream(error: Error): AsyncGenerator<ChatChunk> {
  await Promise.resolve();
  yield chunkOf('partial');
  throw error;
}

interface Harness {
  service: GenerateService;
  createFn: jest.Mock;
}

const setup = (
  options: {
    chunks?: ChatChunk[];
    stream?: AsyncGenerator<ChatChunk>;
    createError?: Error;
  } = {},
): Harness => {
  const { chunks = [], stream, createError } = options;
  const createFn = createError
    ? jest.fn().mockRejectedValue(createError)
    : jest.fn().mockResolvedValue(stream ?? streamFrom(chunks));
  const client = {
    chat: { completions: { create: createFn } },
  } as unknown as OpenAI;
  const service = new GenerateService(client);
  return { service, createFn };
};

const drain = async (gen: AsyncGenerator<string>): Promise<string[]> => {
  const tokens: string[] = [];
  for await (const token of gen) {
    tokens.push(token);
  }
  return tokens;
};

describe('GenerateService', () => {
  describe('generate', () => {
    it('opens one streaming completion with the model, messages, and stream flag', async () => {
      const { service, createFn } = setup({ chunks: [chunkOf('hi')] });

      await drain(service.generate(messages));

      expect(createFn).toHaveBeenCalledTimes(1);
      expect(createFn).toHaveBeenCalledWith({
        model: CHAT_MODEL,
        messages,
        stream: true,
      });
    });

    it('yields each content delta in order', async () => {
      const { service } = setup({
        chunks: [chunkOf('Hello'), chunkOf(' world')],
      });

      const tokens = await drain(service.generate(messages));

      expect(tokens).toEqual(['Hello', ' world']);
    });

    it('skips chunks whose delta content is null, undefined, or empty', async () => {
      const { service } = setup({
        chunks: [
          chunkOf('a'),
          chunkOf(null),
          chunkOf(undefined),
          chunkOf(''),
          chunkOf('b'),
        ],
      });

      const tokens = await drain(service.generate(messages));

      expect(tokens).toEqual(['a', 'b']);
    });

    it('yields nothing for an empty stream', async () => {
      const { service } = setup({ chunks: [] });

      const tokens = await drain(service.generate(messages));

      expect(tokens).toEqual([]);
    });

    it('propagates an error from opening the stream', async () => {
      const error = new Error('OpenAI unavailable');
      const { service } = setup({ createError: error });

      await expect(drain(service.generate(messages))).rejects.toBe(error);
    });

    it('propagates an error thrown mid-stream', async () => {
      const error = new Error('stream interrupted');
      const { service } = setup({ stream: throwingStream(error) });

      await expect(drain(service.generate(messages))).rejects.toBe(error);
    });
  });
});
