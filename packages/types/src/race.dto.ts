export interface RaceDto {
  id: string
  name: string
  date: string
  location: string
  distanceKm: number
  totalObstacles: number
  raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open'
  embeddingStatus: 'pending' | 'complete' | 'failed'
}