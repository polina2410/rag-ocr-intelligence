import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import type { EmbedJobData } from '../queue/embed-job.types.js';
import { EmbedProcessor } from './embed.processor.js';
import type { EmbedService } from './embed.service.js';

const makeJob = (raceId: string, id = '1'): Job<EmbedJobData> =>
  ({ id, data: { raceId } }) as unknown as Job<EmbedJobData>;

interface Harness {
  processor: EmbedProcessor;
  batchEmbedRace: jest.Mock;
}

const setup = (batchError?: Error): Harness => {
  const batchEmbedRace = batchError
    ? jest.fn().mockRejectedValue(batchError)
    : jest.fn().mockResolvedValue(undefined);
  const embedService = { batchEmbedRace } as unknown as EmbedService;
  const processor = new EmbedProcessor(embedService);
  return { processor, batchEmbedRace };
};

describe('EmbedProcessor', () => {
  describe('process', () => {
    it('runs the embedding pipeline for the job race id', async () => {
      const { processor, batchEmbedRace } = setup();

      await processor.process(makeJob('race-1'));

      expect(batchEmbedRace).toHaveBeenCalledTimes(1);
      expect(batchEmbedRace).toHaveBeenCalledWith('race-1');
    });

    it('propagates errors from batchEmbedRace', async () => {
      const error = new Error('embed failed');
      const { processor } = setup(error);

      await expect(processor.process(makeJob('race-1'))).rejects.toBe(error);
    });
  });

  describe('onFailed', () => {
    it('logs the failed job id and error', () => {
      const { processor } = setup();
      const error = new Error('boom');
      const logSpy = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => undefined);

      processor.onFailed(makeJob('race-1', 'job-9'), error);

      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('job-9'),
        expect.any(String),
      );

      logSpy.mockRestore();
    });
  });
});
