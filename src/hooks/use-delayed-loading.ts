import { useState, useEffect } from 'react'

/**
 * Returns true only after `delay` ms of continuous loading.
 * Prevents flashing skeleton/spinner when the response arrives quickly.
 * Rule: under 300ms — show nothing.
 */
export function useDelayedLoading(loading: boolean, delay = 300): boolean {
  const [show, setShow] = useState(false)
  const [prevLoading, setPrevLoading] = useState(loading)

  // Derived state pattern: reset `show` synchronously during render
  // whenever `loading` changes (avoids synchronous setState inside useEffect).
  if (prevLoading !== loading) {
    setPrevLoading(loading)
    setShow(false)
  }

  useEffect(() => {
    if (!loading) return
    const timer = setTimeout(() => setShow(true), delay)
    return () => clearTimeout(timer)
  }, [loading, delay])

  return show
}
