import type { AthleteDto } from './athlete.dto.js'
import type { ObstacleSplitDto } from './race-detail.dto.js'
import type { RaceDto } from './race.dto.js'

export interface AthleteResultDto {
  id: string
  race: RaceDto
  overallPosition: number | null
  finishTimeSeconds: number | null
  status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'
  categoryPosition: number | null
  genderPosition: number | null
  splits: ObstacleSplitDto[]
}

export interface AthleteDetailDto extends AthleteDto {
  results: AthleteResultDto[]
}