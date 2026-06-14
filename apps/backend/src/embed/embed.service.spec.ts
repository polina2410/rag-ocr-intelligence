import type OpenAI from 'openai';
import { EMBEDDING_MODEL } from './embed.constants.js';
import { EmbedService } from './embed.service.js';

const makeClient = (embedding: number[] = [0.1, 0.2, 0.3]) =>
  ({
    embeddings: {
      create: jest.fn().mockResolvedValue({ data: [{ embedding }] }),
    },
  }) as unknown as OpenAI;

describe('EmbedService', () => {
  describe('embed', () => {
    it('calls embeddings.create with the text and correct model', async () => {
      const client = makeClient();
      const service = new EmbedService(client);

      await service.embed('hello world');

      expect(client.embeddings.create).toHaveBeenCalledTimes(1);
      expect(client.embeddings.create).toHaveBeenCalledWith({
        input: 'hello world',
        model: EMBEDDING_MODEL,
      });
    });

    it('returns the embedding array from the response', async () => {
      const vector = [0.1, 0.2, 0.3, 0.4];
      const service = new EmbedService(makeClient(vector));

      const result = await service.embed('some text');

      expect(result).toEqual(vector);
    });

    it('propagates errors from the client without wrapping', async () => {
      const error = new Error('API rate limit exceeded');
      const client = {
        embeddings: { create: jest.fn().mockRejectedValue(error) },
      } as unknown as OpenAI;
      const service = new EmbedService(client);

      await expect(service.embed('text')).rejects.toBe(error);
    });
  });
});