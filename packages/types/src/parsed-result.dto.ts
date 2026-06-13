export interface ParsedObstacleSplit {
  obstacleNumber: number
  obstacleName: string
  splitTimeSeconds: number | null
  penaltyCount: number
}

export interface ParsedRaceResult {
  athlete: {
    firstName: string
    lastName: string
    nationality: string
    category: string
  }
  overallPosition: number | null
  finishTimeSeconds: number | null
  status: 'FINISHED' | 'DNF' | 'DNS' | 'DSQ'
  categoryPosition: number | null
  genderPosition: null
  splits: ParsedObstacleSplit[]
}