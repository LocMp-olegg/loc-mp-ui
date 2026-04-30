import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <>{children}</>
}
