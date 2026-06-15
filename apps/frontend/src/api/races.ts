import { type RaceDetailDto } from '@ocr/types'
import { http } from './http'

export const getRace = (id: string): Promise<RaceDetailDto> =>
  http.get<RaceDetailDto>(`/races/${id}`).then((res) => res.data)