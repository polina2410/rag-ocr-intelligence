import { http } from './http'

export const uploadCsv = (
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ raceId: string; rowsIngested: number }> => {
  const formData = new FormData()
  formData.append('file', file)

  return http
    .post<{ raceId: string; rowsIngested: number }>('/ingest/csv', formData, {
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          onProgress(Math.round((event.loaded / event.total) * 100))
        }
      },
    })
    .then((res) => res.data)
}