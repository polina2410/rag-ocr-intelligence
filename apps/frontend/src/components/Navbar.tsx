import { Link, NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

export const Navbar = () => (
  <nav className={styles.nav} aria-label="Main">
    <Link to="/races" className={styles.brand}>OCR Intelligence</Link>
    <NavLink
      to="/races"
      className={({ isActive }) =>
        isActive ? `${styles.link} ${styles.linkActive}` : styles.link
      }
    >
      Races
    </NavLink>
    <NavLink
      to="/ask"
      className={({ isActive }) =>
        isActive ? `${styles.link} ${styles.linkActive}` : styles.link
      }
    >
      Ask AI
    </NavLink>
    <NavLink
      to="/upload"
      className={({ isActive }) =>
        isActive ? `${styles.link} ${styles.linkActive}` : styles.link
      }
    >
      Upload
    </NavLink>
  </nav>
)