import { Injectable } from '@nestjs/common';
import { RaceResult } from '../entities/race-result.entity.js';
import type { ObstacleSplit } from '../entities/obstacle-split.entity.js';
import { SECONDS_PER_HOUR, SECONDS_PER_MINUTE } from '../common/constants.js';

const STATUS_LABELS: Record<RaceResult['status'], string> = {
  FINISHED: 'finished',
  DNF: 'did not finish (DNF)',
  DNS: 'did not start (DNS)',
  DSQ: 'disqualified (DSQ)',
};

@Injectable()
export class RaceResultSerializerService {
  serialize(result: RaceResult): string {
    const { athlete, race, status } = result;

    const athleteClause = `${athlete.firstName} ${athlete.lastName} (${athlete.nationality}, category ${athlete.category})`;

    const distanceKm = Number(race.distanceKm);
    const raceClause = `${race.name} on ${race.date} in ${race.location} (${distanceKm} km ${race.raceType}, ${race.totalObstacles} obstacles)`;

    let resultClause: string;
    if (status === 'FINISHED') {
      const time =
        result.finishTimeSeconds !== null
          ? ` in ${formatDuration(result.finishTimeSeconds)}`
          : '';
      const positions: string[] = [];
      if (result.overallPosition !== null)
        positions.push(`overall ${result.overallPosition}`);
      if (result.categoryPosition !== null)
        positions.push(`category ${result.categoryPosition}`);
      if (result.genderPosition !== null)
        positions.push(`gender ${result.genderPosition}`);
      const winnerLabel = result.overallPosition === 1 ? ' (race winner)' : '';
      const posClause =
        positions.length > 0
          ? `, placed ${positions.join(', ')}${winnerLabel}`
          : '';
      resultClause = `finished${time}${posClause}`;
    } else {
      resultClause = STATUS_LABELS[status];
    }

    const parts = [`${athleteClause} ${resultClause} at ${raceClause}.`];

    const sortedSplits = [...result.splits].sort(
      (a, b) => a.obstacleNumber - b.obstacleNumber,
    );

    if (sortedSplits.length > 0) {
      const splitPhrases = sortedSplits.map((s) => formatSplit(s));
      parts.push(`Obstacle splits: ${splitPhrases.join('; ')}.`);
    }

    return parts.join(' ');
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / SECONDS_PER_HOUR);
  const m = Math.floor((seconds % SECONDS_PER_HOUR) / SECONDS_PER_MINUTE);
  const s = seconds % SECONDS_PER_MINUTE;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function formatSplit(split: ObstacleSplit): string {
  const time =
    split.splitTimeSeconds !== null
      ? ` (${formatDuration(split.splitTimeSeconds)})`
      : '';
  const penalty =
    split.penaltyCount > 0
      ? `, ${split.penaltyCount} ${split.penaltyCount > 1 ? 'penalties' : 'penalty'}`
      : '';
  return `${split.obstacleNumber}. ${split.obstacleName}${time}${penalty}`;
}
