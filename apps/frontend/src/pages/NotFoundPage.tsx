import { Link } from 'react-router-dom'
import { EmptyState } from '../components/EmptyState'
import styles from './NotFoundPage.module.css'

const NotFoundPage = () => (
  <main className={styles.page}>
    <h1 className={styles.visuallyHidden}>Page not found</h1>
    <EmptyState
      title="Page not found"
      description="This URL doesn't exist. Head back to see all races."
      action={
        <Link to="/races" className={styles.backLink}>
          Back to races
        </Link>
      }
    />
  </main>
)

export default NotFoundPage
