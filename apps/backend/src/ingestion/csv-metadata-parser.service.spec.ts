import * as fs from 'fs';
import * as path from 'path';
import { CsvMetadataParserService } from './csv-metadata-parser.service';

const fix = (name: string) =>
  fs.readFileSync(path.join(__dirname, '../../test/fixtures', name), 'utf-8');

const sprintNoviSad = fix('Spartan_Sprint_Novi_Sad_2024.csv');
const sprintSubotica = fix('Spartan_Sprint_Subotica_2024.csv');
const superBelgrade = fix('Spartan_Super_Belgrade_Open_2024.csv');
const winterZlatibor = fix('OCR_Winter_Challenge_Zlatibor_2024.csv');
const dekaNoviSad = fix('DEKA_FIT_Novi_Sad_2024.csv');

const VALID_HEADER = [
  '# Race: Test Race',
  '# Date: 2024-01-01',
  '# Location: Test Location',
  '# Distance (km): 5.0',
  '# Total obstacles: 10',
  '# Race type: Sprint',
  '# Obstacles: Obstacle One, Obstacle Two',
  '#',
].join('\n');

function withoutField(label: string): string {
  return VALID_HEADER.split('\n')
    .filter(
      (line) => !line.toLowerCase().startsWith(`# ${label.toLowerCase()}`),
    )
    .join('\n');
}

describe('CsvMetadataParserService', () => {
  let service: CsvMetadataParserService;

  beforeEach(() => {
    service = new CsvMetadataParserService();
  });

  describe('parseMetadata — happy path', () => {
    it('parses all fields from Sprint fixture', () => {
      const result = service.parseMetadata(sprintNoviSad);
      expect(result.name).toBe('Spartan Sprint Novi Sad 2024');
      expect(result.date).toBe('2024-04-13');
      expect(result.location).toBe('Fruska Gora, Serbia');
      expect(result.distanceKm).toBe(8);
      expect(result.totalObstacles).toBe(23);
      expect(result.raceType).toBe('Sprint');
      expect(result.obstacles).toHaveLength(17);
      expect(result.obstacles[0]).toBe('Hercules Hoist');
      expect(result.obstacles[16]).toBe('Tyrolean Traverse');
    });

    it('parses raceType DEKA correctly', () => {
      const result = service.parseMetadata(dekaNoviSad);
      expect(result.raceType).toBe('DEKA');
      expect(result.obstacles).toHaveLength(10);
    });

    it('parses raceType Open correctly', () => {
      const result = service.parseMetadata(winterZlatibor);
      expect(result.raceType).toBe('Open');
    });

    it('totalObstacles differs from obstacles.length for Super race', () => {
      const result = service.parseMetadata(superBelgrade);
      expect(result.totalObstacles).toBe(29);
      expect(result.obstacles).toHaveLength(18);
    });

    it('parses decimal distanceKm', () => {
      const result = service.parseMetadata(sprintSubotica);
      expect(result.distanceKm).toBe(8.5);
    });
  });

  describe('parseMetadata — missing required fields', () => {
    it('throws when Race field is missing', () => {
      expect(() => service.parseMetadata(withoutField('Race'))).toThrow('Race');
    });

    it('throws when Date field is missing', () => {
      expect(() => service.parseMetadata(withoutField('Date'))).toThrow('Date');
    });

    it('throws when Location field is missing', () => {
      expect(() => service.parseMetadata(withoutField('Location'))).toThrow(
        'Location',
      );
    });

    it('throws when Distance (km) field is missing', () => {
      expect(() =>
        service.parseMetadata(withoutField('Distance (km)')),
      ).toThrow('Distance');
    });

    it('throws when Total obstacles field is missing', () => {
      expect(() =>
        service.parseMetadata(withoutField('Total obstacles')),
      ).toThrow('Total obstacles');
    });

    it('throws when Race type field is missing', () => {
      expect(() => service.parseMetadata(withoutField('Race type'))).toThrow(
        'Race type',
      );
    });

    it('throws when Obstacles field is missing', () => {
      expect(() => service.parseMetadata(withoutField('Obstacles'))).toThrow(
        'Obstacles',
      );
    });
  });

  describe('parseMetadata — invalid values', () => {
    it('throws on invalid date format', () => {
      const csv = VALID_HEADER.replace('# Date: 2024-01-01', '# Date: 2024-13');
      expect(() => service.parseMetadata(csv)).toThrow('Date');
    });

    it('throws on non-numeric distanceKm', () => {
      const csv = VALID_HEADER.replace(
        '# Distance (km): 5.0',
        '# Distance (km): abc',
      );
      expect(() => service.parseMetadata(csv)).toThrow('Distance');
    });

    it('throws on non-integer totalObstacles', () => {
      const csv = VALID_HEADER.replace(
        '# Total obstacles: 10',
        '# Total obstacles: 29.5',
      );
      expect(() => service.parseMetadata(csv)).toThrow('Total obstacles');
    });

    it('throws on unknown raceType', () => {
      const csv = VALID_HEADER.replace(
        '# Race type: Sprint',
        '# Race type: Marathon',
      );
      expect(() => service.parseMetadata(csv)).toThrow('Race type');
    });

    it('throws on empty obstacles value', () => {
      const csv = VALID_HEADER.replace(
        '# Obstacles: Obstacle One, Obstacle Two',
        '# Obstacles: ',
      );
      expect(() => service.parseMetadata(csv)).toThrow('Obstacles');
    });
  });

  describe('parseMetadata — edge cases', () => {
    it('ignores unknown # labels', () => {
      const csv = VALID_HEADER.replace('#\n', '# Foo: bar\n#\n');
      const result = service.parseMetadata(csv);
      expect(result.name).toBe('Test Race');
      expect(Object.keys(result)).toHaveLength(7);
    });

    it('ignores blank # lines between metadata fields', () => {
      const csv = VALID_HEADER.replace('# Date:', '#\n# Date:');
      const result = service.parseMetadata(csv);
      expect(result.date).toBe('2024-01-01');
    });

    it('matches labels case-insensitively', () => {
      const csv = VALID_HEADER.replace('# Race:', '# race:').replace(
        '# Date:',
        '# DATE:',
      );
      const result = service.parseMetadata(csv);
      expect(result.name).toBe('Test Race');
      expect(result.date).toBe('2024-01-01');
    });

    it('normalises raceType case-insensitively', () => {
      const csv = VALID_HEADER.replace(
        '# Race type: Sprint',
        '# Race type: sprint',
      );
      const result = service.parseMetadata(csv);
      expect(result.raceType).toBe('Sprint');
    });
  });
});
