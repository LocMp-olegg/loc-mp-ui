import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// Disable browser's native scroll restoration — we handle it ourselves.
if (typeof window !== 'undefined') {
  window.history.scrollRestoration = 'manual'
}

/**
 * Scrolls to top on PUSH navigation (new page).
 * POP (back/forward) scroll is handled per-page by useScrollRestore after data loads.
 */
export function ScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType === 'PUSH') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.key, navigationType])

  return null
}
