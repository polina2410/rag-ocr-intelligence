import styles from './SourceCitations.module.css'

export interface Citation {
  id: string
  text: string
  label?: string
  score?: number
}

export interface SourceCitationsProps {
  citations: Citation[]
}

const SCORE_DECIMALS = 2

export const SourceCitations = ({ citations }: SourceCitationsProps) => {
  if (citations.length === 0) {
    return null
  }

  return (
    <details className={styles.panel}>
      <summary className={styles.summary}>Sources ({citations.length})</summary>
      <ul className={styles.list}>
        {citations.map((citation) => (
          <li
            key={citation.id}
            className={styles.item}
            aria-label={citation.label ?? citation.text}
          >
            {citation.label && <p className={styles.label}>{citation.label}</p>}
            <p className={styles.text}>{citation.text}</p>
            {citation.score !== undefined && (
              <p className={styles.score}>Relevance: {citation.score.toFixed(SCORE_DECIMALS)}</p>
            )}
          </li>
        ))}
      </ul>
    </details>
  )
}