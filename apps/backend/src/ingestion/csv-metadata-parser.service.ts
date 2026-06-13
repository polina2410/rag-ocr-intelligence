import { Injectable } from '@nestjs/common';
import type { RaceMetadata } from '@ocr/types';

type RaceType = RaceMetadata['raceType'];

const RACE_TYPE_MAP: Record<string, RaceType> = {
  sprint: 'Sprint',
  super: 'Super',
  deka: 'DEKA',
  open: 'Open',
};

@Injectable()
export class CsvMetadataParserService {
  parseMetadata(csv: string): RaceMetadata {
    const headerLines = this.extractHeaderLines(csv);
    const fields = this.parseHeaderFields(headerLines);

    const name = this.requireString(fields, 'race', 'Race');
    const date = this.requireDate(fields);
    const location = this.requireString(fields, 'location', 'Location');
    const distanceKm = this.requireNumber(
      fields,
      'distance (km)',
      'Distance (km)',
    );
    const totalObstacles = this.requireNonNegativeInt(
      fields,
      'total obstacles',
      'Total obstacles',
    );
    const raceType = this.requireRaceType(fields);
    const obstacles = this.requireObstacles(fields);

    return {
      name,
      date,
      location,
      distanceKm,
      totalObstacles,
      raceType,
      obstacles,
    };
  }

  private extractHeaderLines(csv: string): string[] {
    const lines: string[] = [];
    for (const line of csv.split('\n')) {
      const trimmed = line.trimEnd();
      if (!trimmed.startsWith('#')) break;
      lines.push(trimmed);
    }
    return lines;
  }

  private parseHeaderFields(lines: string[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const line of lines) {
      const content = line.slice(1).trim();
      if (!content) continue;
      const colonIdx = content.indexOf(':');
      if (colonIdx === -1) continue;
      const label = content.slice(0, colonIdx).trim().toLowerCase();
      const value = content.slice(colonIdx + 1).trim();
      if (label) map.set(label, value);
    }
    return map;
  }

  private requireString(
    fields: Map<string, string>,
    key: string,
    label: string,
  ): string {
    const value = fields.get(key);
    if (value === undefined || value === '') {
      throw new Error(`CSV metadata missing required field: "${label}"`);
    }
    return value;
  }

  private requireDate(fields: Map<string, string>): string {
    const value = fields.get('date');
    if (!value) throw new Error('CSV metadata missing required field: "Date"');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new Error(
        `CSV metadata field "Date" must be ISO YYYY-MM-DD, got: "${value}"`,
      );
    }
    return value;
  }

  private requireNumber(
    fields: Map<string, string>,
    key: string,
    label: string,
  ): number {
    const raw = fields.get(key);
    if (raw === undefined || raw === '') {
      throw new Error(`CSV metadata missing required field: "${label}"`);
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) {
      throw new Error(
        `CSV metadata field "${label}" must be a finite number, got: "${raw}"`,
      );
    }
    return n;
  }

  private requireNonNegativeInt(
    fields: Map<string, string>,
    key: string,
    label: string,
  ): number {
    const n = this.requireNumber(fields, key, label);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(
        `CSV metadata field "${label}" must be a non-negative integer, got: ${n}`,
      );
    }
    return n;
  }

  private requireRaceType(fields: Map<string, string>): RaceType {
    const raw = fields.get('race type');
    if (!raw)
      throw new Error('CSV metadata missing required field: "Race type"');
    const canonical = RACE_TYPE_MAP[raw.toLowerCase()];
    if (!canonical) {
      throw new Error(
        `CSV metadata field "Race type" must be one of Sprint | Super | DEKA | Open, got: "${raw}"`,
      );
    }
    return canonical;
  }

  private requireObstacles(fields: Map<string, string>): string[] {
    const raw = fields.get('obstacles');
    if (!raw)
      throw new Error('CSV metadata missing required field: "Obstacles"');
    const list = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    if (list.length === 0) {
      throw new Error(
        'CSV metadata field "Obstacles" must contain at least one entry',
      );
    }
    return list;
  }
}
