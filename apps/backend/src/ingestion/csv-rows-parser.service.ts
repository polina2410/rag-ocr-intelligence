import { Injectable } from '@nestjs/common';
import type {
  ParsedObstacleSplit,
  ParsedRaceResult,
  RaceMetadata,
} from '@ocr/types';

const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_MINUTE = 60;

type Status = ParsedRaceResult['status'];

@Injectable()
export class CsvRowsParserService {
  parseRows(csv: string, metadata: RaceMetadata): ParsedRaceResult[] {
    const lines = csv.split('\n');
    let i = 0;

    while (i < lines.length && lines[i].trimEnd().startsWith('#')) {
      i++;
    }

    if (i >= lines.length) return [];
    const headerLine = lines[i++];
    const columns = headerLine.split(',').map((c) => c.trim());

    const splitColIndices = columns
      .map((name, idx) => ({ name, idx }))
      .filter(({ name }) => name.startsWith('split_'))
      .map(({ idx }) => idx);

    if (splitColIndices.length !== metadata.obstacles.length) {
      throw new Error(
        `CSV split column count (${splitColIndices.length}) does not match ` +
          `metadata.obstacles length (${metadata.obstacles.length})`,
      );
    }

    const col = (name: string): number => {
      const idx = columns.indexOf(name);
      if (idx === -1) throw new Error(`CSV missing expected column: "${name}"`);
      return idx;
    };

    const idxFirstName = col('first_name');
    const idxLastName = col('last_name');
    const idxCategory = col('category');
    const idxNationality = col('nationality');
    const idxFinishTime = col('finish_time');
    const idxPenaltyObstacles = col('penalty_obstacles');
    const idxOverallPlace = col('overall_place');
    const idxCategoryPlace = col('category_place');

    const results: ParsedRaceResult[] = [];

    for (; i < lines.length; i++) {
      const line = lines[i].trimEnd();
      if (!line) continue;

      const cells = line.split(',').map((c) => c.trim());
      const finishTimeRaw = cells[idxFinishTime] ?? '';
      const status = this.parseStatus(finishTimeRaw);

      const finishTimeSeconds =
        status === 'FINISHED' && finishTimeRaw
          ? this.parseTime(finishTimeRaw, 'finish_time')
          : null;

      const overallPosition = this.parseOptionalInt(
        cells[idxOverallPlace] ?? '',
        'overall_place',
      );
      const categoryPosition = this.parseOptionalInt(
        cells[idxCategoryPlace] ?? '',
        'category_place',
      );

      const penaltySet = this.parsePenaltySet(cells[idxPenaltyObstacles] ?? '');

      let splits: ParsedObstacleSplit[] = [];
      if (status === 'FINISHED') {
        splits = splitColIndices.map((colIdx, obstacleIdx) => {
          const raw = cells[colIdx] ?? '';
          const splitTimeSeconds = raw
            ? this.parseTime(raw, `split column ${colIdx}`)
            : null;
          const obstacleName = metadata.obstacles[obstacleIdx];
          return {
            obstacleNumber: obstacleIdx + 1,
            obstacleName,
            splitTimeSeconds,
            penaltyCount: penaltySet.has(obstacleName) ? 1 : 0,
          };
        });
      }

      results.push({
        athlete: {
          firstName: cells[idxFirstName] ?? '',
          lastName: cells[idxLastName] ?? '',
          nationality: cells[idxNationality] ?? '',
          category: cells[idxCategory] ?? '',
        },
        overallPosition,
        finishTimeSeconds,
        status,
        categoryPosition,
        genderPosition: null,
        splits,
      });
    }

    return results;
  }

  private parseStatus(raw: string): Status {
    switch (raw.toLowerCase()) {
      case 'dns':
        return 'DNS';
      case 'dnf':
        return 'DNF';
      case 'dsq':
        return 'DSQ';
      default:
        return 'FINISHED';
    }
  }

  private parseTime(value: string, context: string): number {
    const parts = value.split(':');
    if (parts.length === 2) {
      const [m, s] = parts.map((p) => this.requireInt(p, context));
      return m * SECONDS_PER_MINUTE + s;
    }
    if (parts.length === 3) {
      const [h, m, s] = parts.map((p) => this.requireInt(p, context));
      return h * SECONDS_PER_HOUR + m * SECONDS_PER_MINUTE + s;
    }
    throw new Error(`Invalid time format in ${context}: "${value}"`);
  }

  private requireInt(raw: string, context: string): number {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`Non-integer time component in ${context}: "${raw}"`);
    }
    return n;
  }

  private parseOptionalInt(raw: string, context: string): number | null {
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0) {
      throw new Error(`Non-integer value in ${context}: "${raw}"`);
    }
    return n;
  }

  private parsePenaltySet(raw: string): Set<string> {
    if (!raw) return new Set();
    return new Set(
      raw
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    );
  }
}
