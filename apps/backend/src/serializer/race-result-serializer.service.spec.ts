import { RaceResultSerializerService } from './race-result-serializer.service.js';
import type { RaceResult } from '../entities/race-result.entity.js';
import type { Race } from '../entities/race.entity.js';
import type { Athlete } from '../entities/athlete.entity.js';
import type { ObstacleSplit } from '../entities/obstacle-split.entity.js';

const makeRace = (overrides: Partial<Race> = {}): Race => ({
  id: 'race-1',
  name: 'OCR Championship',
  date: '2026-05-10',
  location: 'London',
  distanceKm: 10.5,
  totalObstacles: 25,
  raceType: 'Sprint',
  results: [],
  ...overrides,
});

const makeAthlete = (overrides: Partial<Athlete> = {}): Athlete => ({
  id: 'ath-1',
  firstName: 'Jane',
  lastName: 'Smith',
  nationality: 'GBR',
  category: 'F30-34',
  results: [],
  ...overrides,
});

const makeSplit = (overrides: Partial<ObstacleSplit>): ObstacleSplit => ({
  id: `split-${overrides.obstacleNumber ?? 1}`,
  raceResultId: 'rr-1',
  raceResult: {} as RaceResult,
  obstacleNumber: 1,
  obstacleName: 'Rope Climb',
  splitTimeSeconds: 45,
  penaltyCount: 0,
  ...overrides,
});

const makeResult = (overrides: Partial<RaceResult> = {}): RaceResult => ({
  id: 'rr-1',
  raceId: 'race-1',
  athleteId: 'ath-1',
  race: makeRace(),
  athlete: makeAthlete(),
  status: 'FINISHED',
  finishTimeSeconds: 3600,
  overallPosition: 5,
  categoryPosition: 2,
  genderPosition: 3,
  splits: [],
  ...overrides,
});

describe('RaceResultSerializerService', () => {
  let service: RaceResultSerializerService;

  beforeEach(() => {
    service = new RaceResultSerializerService();
  });

  describe('FINISHED result with all positions', () => {
    it('includes athlete, race, finish time, and all positions', () => {
      const result = makeResult({
        finishTimeSeconds: 3661,
        overallPosition: 1,
        categoryPosition: 1,
        genderPosition: 1,
        splits: [
          makeSplit({
            obstacleNumber: 1,
            obstacleName: 'Rope Climb',
            splitTimeSeconds: 45,
            penaltyCount: 0,
          }),
          makeSplit({
            obstacleNumber: 2,
            obstacleName: 'Wall',
            splitTimeSeconds: 30,
            penaltyCount: 1,
          }),
        ],
      });

      const text = service.serialize(result);

      expect(text).toContain('Jane Smith');
      expect(text).toContain('GBR');
      expect(text).toContain('F30-34');
      expect(text).toContain('OCR Championship');
      expect(text).toContain('2026-05-10');
      expect(text).toContain('London');
      expect(text).toContain('Sprint');
      expect(text).toContain('1:01:01');
      expect(text).toContain('overall 1');
      expect(text).toContain('category 1');
      expect(text).toContain('gender 1');
      expect(text).toContain('Rope Climb');
      expect(text).toContain('Wall');
      expect(text).toContain('1 penalty');
    });
  });

  describe('DNF result with some null split times', () => {
    it('states DNF in words, no finish time or position, includes named splits', () => {
      const result = makeResult({
        status: 'DNF',
        finishTimeSeconds: null,
        overallPosition: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [
          makeSplit({
            obstacleNumber: 1,
            obstacleName: 'Mud Pit',
            splitTimeSeconds: 60,
            penaltyCount: 0,
          }),
          makeSplit({
            obstacleNumber: 2,
            obstacleName: 'Rope Climb',
            splitTimeSeconds: null,
            penaltyCount: 0,
          }),
        ],
      });

      const text = service.serialize(result);

      expect(text).toContain('did not finish (DNF)');
      expect(text).not.toContain('finished in');
      expect(text).not.toContain('overall');
      expect(text).toContain('Mud Pit');
      expect(text).toContain('Rope Climb');
    });

    it('includes split with null splitTimeSeconds by name without crashing', () => {
      const result = makeResult({
        status: 'DNF',
        finishTimeSeconds: null,
        overallPosition: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [
          makeSplit({
            obstacleNumber: 1,
            obstacleName: 'Wall',
            splitTimeSeconds: null,
            penaltyCount: 0,
          }),
        ],
      });

      const text = service.serialize(result);

      expect(text).toContain('Wall');
      expect(text).not.toMatch(/\bnull\b/);
    });
  });

  describe('DNS and DSQ status labels', () => {
    it('states DNS in words', () => {
      const result = makeResult({
        status: 'DNS',
        finishTimeSeconds: null,
        overallPosition: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [],
      });

      expect(service.serialize(result)).toContain('did not start (DNS)');
    });

    it('states DSQ in words', () => {
      const result = makeResult({
        status: 'DSQ',
        finishTimeSeconds: null,
        overallPosition: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [],
      });

      expect(service.serialize(result)).toContain('disqualified (DSQ)');
    });
  });

  describe('empty splits array', () => {
    it('returns a valid string with no crash and no obstacle sentence', () => {
      const result = makeResult({ splits: [] });

      const text = service.serialize(result);

      expect(text.length).toBeGreaterThan(0);
      expect(text).not.toContain('Obstacle splits');
    });
  });

  describe('H:MM:SS vs MM:SS time format boundary', () => {
    it('formats exactly 3600 seconds as 1:00:00', () => {
      const result = makeResult({ finishTimeSeconds: 3600, splits: [] });
      expect(service.serialize(result)).toContain('1:00:00');
    });

    it('formats 3599 seconds as 59:59', () => {
      const result = makeResult({ finishTimeSeconds: 3599, splits: [] });
      expect(service.serialize(result)).toContain('59:59');
    });

    it('formats 90 seconds as 01:30', () => {
      const result = makeResult({ finishTimeSeconds: 90, splits: [] });
      expect(service.serialize(result)).toContain('01:30');
    });
  });

  describe('null positions omitted', () => {
    it('omits null overall position', () => {
      const result = makeResult({
        finishTimeSeconds: 600,
        overallPosition: null,
        categoryPosition: 2,
        genderPosition: null,
        splits: [],
      });

      const text = service.serialize(result);

      expect(text).toContain('category 2');
      expect(text).not.toContain('overall');
      expect(text).not.toContain('gender');
      expect(text).not.toMatch(/\bnull\b/);
    });

    it('omits position clause entirely when all positions are null', () => {
      const result = makeResult({
        finishTimeSeconds: 600,
        overallPosition: null,
        categoryPosition: null,
        genderPosition: null,
        splits: [],
      });

      const text = service.serialize(result);

      expect(text).not.toContain('placed');
      expect(text).not.toMatch(/\bnull\b/);
    });
  });

  describe('distanceKm string coercion', () => {
    it('handles distanceKm arriving as a string from Postgres', () => {
      const race = makeRace({ distanceKm: '12.50' as unknown as number });
      const result = makeResult({ race, splits: [] });

      const text = service.serialize(result);

      expect(text).toContain('12.5');
      expect(text).not.toContain('[object');
    });
  });

  describe('splits sorting', () => {
    it('renders splits in ascending obstacleNumber order regardless of input order', () => {
      const result = makeResult({
        splits: [
          makeSplit({
            obstacleNumber: 3,
            obstacleName: 'Third',
            splitTimeSeconds: 30,
            penaltyCount: 0,
          }),
          makeSplit({
            obstacleNumber: 1,
            obstacleName: 'First',
            splitTimeSeconds: 10,
            penaltyCount: 0,
          }),
          makeSplit({
            obstacleNumber: 2,
            obstacleName: 'Second',
            splitTimeSeconds: 20,
            penaltyCount: 0,
          }),
        ],
      });

      const text = service.serialize(result);
      const firstIdx = text.indexOf('First');
      const secondIdx = text.indexOf('Second');
      const thirdIdx = text.indexOf('Third');

      expect(firstIdx).toBeLessThan(secondIdx);
      expect(secondIdx).toBeLessThan(thirdIdx);
    });
  });

  describe('penalties', () => {
    it('omits penalty phrase when penaltyCount is 0', () => {
      const result = makeResult({
        splits: [
          makeSplit({
            obstacleNumber: 1,
            obstacleName: 'Wall',
            splitTimeSeconds: 30,
            penaltyCount: 0,
          }),
        ],
      });

      expect(service.serialize(result)).not.toContain('penalty');
    });

    it('uses plural "penalties" for penaltyCount > 1', () => {
      const result = makeResult({
        splits: [
          makeSplit({
            obstacleNumber: 1,
            obstacleName: 'Wall',
            splitTimeSeconds: 30,
            penaltyCount: 2,
          }),
        ],
      });

      expect(service.serialize(result)).toContain('2 penalties');
    });
  });
});
