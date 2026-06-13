import * as fs from 'fs';
import * as path from 'path';
import { CsvMetadataParserService } from './csv-metadata-parser.service';
import { CsvRowsParserService } from './csv-rows-parser.service';

const fix = (name: string) =>
  fs.readFileSync(path.join(__dirname, '../../test/fixtures', name), 'utf-8');

const sprintNoviSad = fix('Spartan_Sprint_Novi_Sad_2024.csv');
const sprintSubotica = fix('Spartan_Sprint_Subotica_2024.csv');
const superBelgrade = fix('Spartan_Super_Belgrade_Open_2024.csv');
const dekaNoviSad = fix('DEKA_FIT_Novi_Sad_2024.csv');

const metaSvc = new CsvMetadataParserService();
const sprintMeta = metaSvc.parseMetadata(sprintNoviSad);
const suboticaMeta = metaSvc.parseMetadata(sprintSubotica);
const superMeta = metaSvc.parseMetadata(superBelgrade);
const dekaMeta = metaSvc.parseMetadata(dekaNoviSad);

describe('CsvRowsParserService', () => {
  let service: CsvRowsParserService;

  beforeEach(() => {
    service = new CsvRowsParserService();
  });

  describe('parseRows — row count', () => {
    it('returns 22 rows for Sprint Novi Sad fixture', () => {
      expect(service.parseRows(sprintNoviSad, sprintMeta)).toHaveLength(22);
    });

    it('returns 20 rows for Sprint Subotica fixture', () => {
      expect(service.parseRows(sprintSubotica, suboticaMeta)).toHaveLength(20);
    });

    it('returns 19 rows for Super Belgrade fixture', () => {
      expect(service.parseRows(superBelgrade, superMeta)).toHaveLength(19);
    });

    it('returns 19 rows for DEKA Novi Sad fixture', () => {
      expect(service.parseRows(dekaNoviSad, dekaMeta)).toHaveLength(19);
    });
  });

  describe('parseRows — FINISHED row mapping', () => {
    it('maps athlete fields correctly', () => {
      const rows = service.parseRows(dekaNoviSad, dekaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Chloe' && r.athlete.lastName === 'Thomas',
      );
      expect(row).toBeDefined();
      expect(row!.athlete.category).toBe('Elite Men');
      expect(row!.athlete.nationality).toBe('DEU');
    });

    it('maps status, finishTimeSeconds, and positions for FINISHED row', () => {
      const rows = service.parseRows(dekaNoviSad, dekaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Chloe' && r.athlete.lastName === 'Thomas',
      );
      expect(row!.status).toBe('FINISHED');
      expect(row!.finishTimeSeconds).toBe(1828); // 30*60+28
      expect(row!.overallPosition).toBe(1);
      expect(row!.categoryPosition).toBe(1);
      expect(row!.genderPosition).toStrictEqual(null);
    });

    it('produces correct splits count for DEKA row', () => {
      const rows = service.parseRows(dekaNoviSad, dekaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Chloe' && r.athlete.lastName === 'Thomas',
      );
      expect(row!.splits).toHaveLength(10);
    });

    it('maps first split fields correctly', () => {
      const rows = service.parseRows(dekaNoviSad, dekaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Chloe' && r.athlete.lastName === 'Thomas',
      );
      expect(row!.splits[0].obstacleNumber).toBe(1);
      expect(row!.splits[0].obstacleName).toBe('Sled Pull');
      expect(row!.splits[0].splitTimeSeconds).toBe(189); // 3*60+9
      expect(row!.splits[0].penaltyCount).toBe(0);
    });

    it('genderPosition is strictly null for every row', () => {
      const rows = service.parseRows(dekaNoviSad, dekaMeta);
      rows.forEach((row) => expect(row.genderPosition).toStrictEqual(null));
    });
  });

  describe('parseRows — HH:MM:SS time format', () => {
    it('parses HH:MM:SS finish time correctly', () => {
      const rows = service.parseRows(sprintNoviSad, sprintMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Adam' && r.athlete.lastName === 'Jovanovic',
      );
      expect(row!.finishTimeSeconds).toBe(4116); // 1*3600+8*60+36
    });

    it('parses HH:MM:SS split time correctly', () => {
      const rows = service.parseRows(sprintNoviSad, sprintMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Adam' && r.athlete.lastName === 'Jovanovic',
      );
      // split index 15 (Monkey Bars) = 01:01:46
      expect(row!.splits[15].splitTimeSeconds).toBe(3706); // 1*3600+1*60+46
    });
  });

  describe('parseRows — DNS row', () => {
    it('sets status to DNS', () => {
      const rows = service.parseRows(sprintNoviSad, sprintMeta);
      const row = rows.find((r) => r.athlete.lastName === 'Jones');
      expect(row!.status).toBe('DNS');
    });

    it('sets finishTimeSeconds to null for DNS', () => {
      const rows = service.parseRows(sprintNoviSad, sprintMeta);
      const row = rows.find((r) => r.athlete.lastName === 'Jones');
      expect(row!.finishTimeSeconds).toStrictEqual(null);
    });

    it('sets overallPosition and categoryPosition to null for DNS', () => {
      const rows = service.parseRows(sprintNoviSad, sprintMeta);
      const row = rows.find((r) => r.athlete.lastName === 'Jones');
      expect(row!.overallPosition).toStrictEqual(null);
      expect(row!.categoryPosition).toStrictEqual(null);
    });

    it('produces empty splits array for DNS row', () => {
      const rows = service.parseRows(sprintNoviSad, sprintMeta);
      const row = rows.find((r) => r.athlete.lastName === 'Jones');
      expect(row!.splits).toHaveLength(0);
    });
  });

  describe('parseRows — DNF row', () => {
    it('sets status to DNF', () => {
      const rows = service.parseRows(sprintSubotica, suboticaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Matt' && r.athlete.lastName === 'Roberts',
      );
      expect(row!.status).toBe('DNF');
    });

    it('produces empty splits array for DNF row', () => {
      const rows = service.parseRows(sprintSubotica, suboticaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Matt' && r.athlete.lastName === 'Roberts',
      );
      expect(row!.splits).toHaveLength(0);
    });

    it('sets finishTimeSeconds to null for DNF', () => {
      const rows = service.parseRows(sprintSubotica, suboticaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Matt' && r.athlete.lastName === 'Roberts',
      );
      expect(row!.finishTimeSeconds).toStrictEqual(null);
    });
  });

  describe('parseRows — penalty count', () => {
    it('sets penaltyCount 1 on penalised obstacles', () => {
      // bib=7491, Ruby Anderson: penalty_obstacles = "Rope Climb; Multi Rig"
      // Rope Climb = index 5, Multi Rig = index 15
      const rows = service.parseRows(sprintSubotica, suboticaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Ruby' && r.athlete.lastName === 'Anderson',
      );
      expect(row!.splits[5].obstacleName).toBe('Rope Climb');
      expect(row!.splits[5].penaltyCount).toBe(1);
      expect(row!.splits[15].obstacleName).toBe('Multi Rig');
      expect(row!.splits[15].penaltyCount).toBe(1);
    });

    it('sets penaltyCount 0 on non-penalised obstacles', () => {
      const rows = service.parseRows(sprintSubotica, suboticaMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Ruby' && r.athlete.lastName === 'Anderson',
      );
      expect(row!.splits[0].penaltyCount).toBe(0); // Rolling Mud
    });

    it('all splits have penaltyCount 0 for DEKA fixture', () => {
      const rows = service.parseRows(dekaNoviSad, dekaMeta);
      rows.forEach((row) => {
        row.splits.forEach((split) => expect(split.penaltyCount).toBe(0));
      });
    });
  });

  describe('parseRows — ordinal split alignment', () => {
    it('derives obstacleName from metadata not CSV column suffix', () => {
      const rows = service.parseRows(superBelgrade, superMeta);
      const row = rows.find(
        (r) =>
          r.athlete.firstName === 'Ivan' && r.athlete.lastName === 'Mitchell',
      );
      expect(superMeta.obstacles[0]).toBe('Tire Drag');
      expect(row!.splits[0].obstacleName).toBe('Tire Drag');
    });

    it('every FINISHED row in Super fixture has 18 splits', () => {
      const rows = service.parseRows(superBelgrade, superMeta);
      rows
        .filter((r) => r.status === 'FINISHED')
        .forEach((r) => expect(r.splits).toHaveLength(18));
    });
  });

  describe('parseRows — errors', () => {
    it('throws when split column count does not match metadata obstacles', () => {
      // sprintSubotica has 17 split columns; superMeta has 18 obstacles
      expect(() => service.parseRows(sprintSubotica, superMeta)).toThrow();
    });

    it('throws when a required column is missing from the header row', () => {
      const csv = [
        '# Race: Test',
        '# Date: 2024-01-01',
        '# Location: Test',
        '# Distance (km): 5.0',
        '# Total obstacles: 2',
        '# Race type: Sprint',
        '# Obstacles: A, B',
        '#',
        // overall_place is omitted
        'bib,first_name,last_name,category,nationality,finish_time,chip_time,total_penalties_sec,penalty_obstacles,obstacles_completed,category_place,split_a,split_b',
        '1,John,Doe,Cat,SRB,01:00,01:00,0,,2,1,00:30,01:00',
      ].join('\n');
      const meta = metaSvc.parseMetadata(csv);
      expect(() => service.parseRows(csv, meta)).toThrow('overall_place');
    });

    it('throws on invalid time string in a split cell', () => {
      const csv = [
        '# Race: Test',
        '# Date: 2024-01-01',
        '# Location: Test',
        '# Distance (km): 5.0',
        '# Total obstacles: 2',
        '# Race type: Sprint',
        '# Obstacles: A, B',
        '#',
        'bib,first_name,last_name,category,nationality,finish_time,chip_time,total_penalties_sec,penalty_obstacles,obstacles_completed,overall_place,category_place,split_a,split_b',
        '1,John,Doe,Cat,SRB,01:00,01:00,0,,2,1,1,abc,01:00',
      ].join('\n');
      const meta = metaSvc.parseMetadata(csv);
      expect(() => service.parseRows(csv, meta)).toThrow();
    });
  });
});
