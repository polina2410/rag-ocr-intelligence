import styles from './CategoryFilter.module.css'

export interface CategoryFilterProps {
  categories: string[]
  value: string | null
  onChange: (value: string | null) => void
}

const ALL_SENTINEL = ''
const ALL_LABEL = 'All categories'

export const CategoryFilter = ({ categories, value, onChange }: CategoryFilterProps) => {
  const selectValue = value ?? ALL_SENTINEL

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value
    onChange(selected === ALL_SENTINEL ? null : selected)
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="category-filter" className={styles.label}>
        Category
      </label>
      <select
        id="category-filter"
        className={styles.select}
        value={selectValue}
        onChange={handleChange}
      >
        <option value={ALL_SENTINEL}>{ALL_LABEL}</option>
        {categories.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>
    </div>
  )
}