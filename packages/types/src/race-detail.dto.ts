import type { AthleteDto } from './athlete.dto.js'
import type { RaceDto } from './race.dto.js'

export interface ObstacleSplitDto {
  obstacleNumber: number
  obstacleName: string
  splitTimeSeconds: number | null
  penaltyCount: number
}

export interface RaceResultDto {
  id: string
  athlete: AthleteDto
  overallPosition: number | null
  finishTimeSeconds: number | null
  status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'
  categoryPosition: number | null
  genderPosition: number | null
  splits: ObstacleSplitDto[]
}

export interface RaceDetailDto extends RaceDto {
  results: RaceResultDto[]
}