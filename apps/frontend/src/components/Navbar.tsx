import { NavLink } from 'react-router-dom'
import styles from './Navbar.module.css'

export const Navbar = () => (
  <nav className={styles.nav} aria-label="Main">
    <span className={styles.brand}>ocr-intelligence</span>
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
  </nav>
)