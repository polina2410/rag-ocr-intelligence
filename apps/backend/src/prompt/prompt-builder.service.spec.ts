import type { RetrievedChunk } from '../retrieve/retrieve.service.js';
import {
  MESSAGE_COUNT,
  NO_CONTEXT_INSTRUCTION,
  SYSTEM_INSTRUCTION,
} from './prompt.constants.js';
import { PromptBuilderService } from './prompt-builder.service.js';

const makeChunk = (text: string | undefined, id = 'rr-1'): RetrievedChunk => ({
  id,
  score: 0.9,
  metadata: {
    raceResultId: id,
    raceId: 'race-1',
    athleteId: 'athlete-1',
    athleteName: 'Jane Smith',
    raceName: 'OCR Champ',
    raceDate: '2026-05-10',
    // text may be absent at runtime for points ingested before the field existed
    text: text as string,
  },
});

const systemContentOf = (
  messages: ReturnType<PromptBuilderService['buildMessages']>,
): string => messages[0].content as string;

const userContentOf = (
  messages: ReturnType<PromptBuilderService['buildMessages']>,
): string => messages[1].content as string;

describe('PromptBuilderService', () => {
  const service = new PromptBuilderService();

  it('returns a system message then a user message', () => {
    const messages = service.buildMessages('who won?', [makeChunk('a result')]);

    expect(messages).toHaveLength(MESSAGE_COUNT);
    expect(messages[0].role).toBe('system');
    expect(messages[1].role).toBe('user');
  });

  it('includes each chunk text in the system message, in input order', () => {
    const messages = service.buildMessages('q', [
      makeChunk('Alpha finished first', 'rr-1'),
      makeChunk('Bravo finished second', 'rr-2'),
    ]);
    const system = systemContentOf(messages);

    expect(system).toContain(SYSTEM_INSTRUCTION);
    expect(system).toContain('Alpha finished first');
    expect(system).toContain('Bravo finished second');
    expect(system.indexOf('Alpha finished first')).toBeLessThan(
      system.indexOf('Bravo finished second'),
    );
  });

  it('places the raw query verbatim in the user message', () => {
    const query = 'Who had the fastest Rope Climb split?';
    const messages = service.buildMessages(query, [makeChunk('some context')]);

    expect(userContentOf(messages)).toBe(query);
  });

  it('uses the no-data instruction when there are no chunks', () => {
    const messages = service.buildMessages('q', []);
    const system = systemContentOf(messages);

    expect(system).toBe(NO_CONTEXT_INSTRUCTION);
    expect(system).not.toContain(SYSTEM_INSTRUCTION);
  });

  it('skips chunks with missing or empty text without throwing', () => {
    const messages = service.buildMessages('q', [
      makeChunk(undefined, 'rr-1'),
      makeChunk('   ', 'rr-2'),
      makeChunk('real context', 'rr-3'),
    ]);
    const system = systemContentOf(messages);

    expect(system).toContain(SYSTEM_INSTRUCTION);
    expect(system).toContain('real context');
    // only the one usable chunk is numbered
    expect(system).toContain('1. real context');
    expect(system).not.toContain('2.');
  });

  it('uses the no-data instruction when every chunk lacks usable text', () => {
    const messages = service.buildMessages('q', [
      makeChunk(undefined, 'rr-1'),
      makeChunk('', 'rr-2'),
    ]);

    expect(systemContentOf(messages)).toBe(NO_CONTEXT_INSTRUCTION);
  });
});
