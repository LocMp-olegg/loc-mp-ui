import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export function useScrollRestore(isReady: boolean) {
  const { pathname, search } = useLocation()
  const navigationType = useNavigationType()

  const mountKey = useRef(`${pathname}${search}`)
  const mountNavType = useRef(navigationType)

  useLayoutEffect(() => {
    if (!isReady || mountNavType.current !== 'POP') return
    const saved = sessionStorage.getItem(`scroll:${mountKey.current}`)
    if (!saved) return
    const y = parseInt(saved, 10)
    window.scrollTo({ top: y, behavior: 'instant' })
  }, [isReady])

  useEffect(() => {
    const key = `${pathname}${search}`
    const save = () => sessionStorage.setItem(`scroll:${key}`, String(window.scrollY))
    window.addEventListener('scroll', save, { passive: true })
    return () => window.removeEventListener('scroll', save)
  }, [pathname, search])
}
