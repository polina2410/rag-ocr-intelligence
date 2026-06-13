import type { RaceDto } from './race.dto.js'

export interface RaceMetadata {
  name: string
  date: string
  location: string
  distanceKm: number
  totalObstacles: number
  raceType: RaceDto['raceType']
  obstacles: string[]
}