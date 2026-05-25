import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'

interface RequireCourierProps {
  children: React.ReactNode
}

export function RequireCourier({ children }: RequireCourierProps) {
  const { user, initializing } = useAuth()

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const roles = Array.isArray(user.role) ? user.role : [user.role]
  if (!roles.includes('Courier')) return <Navigate to="/profile" replace />

  return <>{children}</>
}
