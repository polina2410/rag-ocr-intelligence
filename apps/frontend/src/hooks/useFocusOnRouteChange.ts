import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useFocusOnRouteChange = (): void => {
  const { pathname } = useLocation()
  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>('h1')
    if (h1) {
      h1.tabIndex = -1
      h1.focus()
    }
  }, [pathname])
}
