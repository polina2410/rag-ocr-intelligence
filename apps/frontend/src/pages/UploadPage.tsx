import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { DropZone } from '../components/DropZone'
import { PageWrapper } from '../components/PageWrapper'
import { uploadCsv } from '../api/ingest'
import styles from './UploadPage.module.css'

const extractErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const message: unknown = err.response?.data?.message
    if (typeof message === 'string') return message
    if (Array.isArray(message)) return message.join('; ')
  }
  return 'Upload failed. Please try again.'
}

const UploadPage = () => {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setStatus('uploading')
    setProgress(0)
    setErrorMsg(null)

    uploadCsv(file, setProgress)
      .then((data) => {
        navigate(`/races/${data.raceId}`)
      })
      .catch((err: unknown) => {
        setStatus('error')
        setErrorMsg(extractErrorMessage(err))
      })
  }

  return (
    <PageWrapper>
      <h1 className={styles.heading}>Upload Race Data</h1>
      <div className={styles.dropZoneWrap}>
        <DropZone onFile={handleFile} disabled={status === 'uploading'} />
      </div>
      {status === 'uploading' && (
        <div>
          <div>
            <div
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Upload progress"
              className={styles.progressTrack}
            >
              <div
                className={styles.progressFill}
                style={{ '--pct': `${progress}%` } as React.CSSProperties}
              />
            </div>
          </div>
          <p className={styles.progressLabel}>{progress}%</p>
        </div>
      )}
      {status === 'error' && errorMsg && (
        <p className={styles.error} role="alert">
          {errorMsg}
        </p>
      )}
    </PageWrapper>
  )
}

export default UploadPage