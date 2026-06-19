import { type PaginatedResponse, type RaceDetailDto, type RaceDto } from '@ocr/types'
import { http } from './http'

export const getRaces = (page = 1, limit = 20): Promise<PaginatedResponse<RaceDto>> =>
  http.get<PaginatedResponse<RaceDto>>('/races', { params: { page, limit } }).then((res) => res.data)

export const getRace = (id: string): Promise<RaceDetailDto> =>
  http.get<RaceDetailDto>(`/races/${id}`).then((res) => res.data)

export const deleteRace = (id: string): Promise<void> =>
  http.delete(`/races/${id}`).then(() => undefined)

export const triggerEmbed = (id: string): Promise<void> =>
  http.post(`/races/${id}/embed`).then(() => undefined)