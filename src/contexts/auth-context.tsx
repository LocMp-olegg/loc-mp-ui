import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  loginRequest,
  refreshAccessToken,
  setTokens,
  clearTokens,
  getStoredRefreshToken,
  setOnAuthFailure,
  parseJwt,
} from '@/lib/auth'
import { UsersService } from '@/api/identity'
import type { RegisterUserCommand } from '@/api/identity'
import { AuthPromptModal } from '@/components/auth/auth-prompt-modal'
import { LOCATION_CLEAR_EVENT } from '@/contexts/location-context'

export interface AuthUser {
  id: string
  email: string
  username: string
  role: string | string[]
}

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  initializing: boolean
  login: (usernameOrEmail: string, password: string) => Promise<void>
  register: (data: RegisterUserCommand) => Promise<void>
  logout: () => void
  openAuthPrompt: () => void
  refreshUser: () => Promise<void>
  updateRoles: (roles: string[]) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function userFromToken(token: string, fallbackEmail?: string): AuthUser {
  const claims = parseJwt(token)
  return {
    id: String(claims['sub'] ?? ''),
    email: String(claims['email'] ?? fallbackEmail ?? ''),
    username: String(claims['preferred_username'] ?? claims['name'] ?? ''),
    role: (claims['role'] as string | string[]) ?? '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [initializing, setInitializing] = useState(() => !!getStoredRefreshToken())
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null)
      localStorage.removeItem('user-location')
      window.dispatchEvent(new Event(LOCATION_CLEAR_EVENT))
      navigate('/login', { replace: true })
    })

    if (!getStoredRefreshToken()) return

    let cancelled = false
    refreshAccessToken()
      .then(async (token) => {
        if (cancelled) return
        setUser(userFromToken(token))
        // Sync roles from profile: refresh_token grant may return stale claims
        try {
          const res = await fetch('http://localhost:5000/api/identity/profile')
          if (!cancelled && res.ok) {
            const profile = (await res.json()) as { roles?: string[] | null }
            if (!cancelled && Array.isArray(profile.roles) && profile.roles.length > 0) {
              setUser((prev) => (prev ? { ...prev, role: profile.roles! } : null))
            }
          }
        } catch {
          // best-effort: JWT roles are good enough if profile sync fails
        }
      })
      .catch(() => {
        if (!cancelled) clearTokens()
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate])

  const login = async (usernameOrEmail: string, password: string) => {
    const { access_token, refresh_token } = await loginRequest(usernameOrEmail, password)
    setTokens(access_token, refresh_token)
    setUser(userFromToken(access_token, usernameOrEmail))
  }

  const register = async (data: RegisterUserCommand) => {
    await UsersService.postApiIdentityUsers({ requestBody: data })
  }

  const logout = () => {
    clearTokens()
    setUser(null)
    localStorage.removeItem('user-location')
    window.dispatchEvent(new Event(LOCATION_CLEAR_EVENT))
    navigate('/login', { replace: true })
  }

  const refreshUser = async () => {
    const token = await refreshAccessToken()
    setUser(userFromToken(token))
  }

  const updateRoles = (roles: string[]) => {
    setUser((prev) => (prev ? { ...prev, role: roles } : null))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        initializing,
        login,
        register,
        logout,
        openAuthPrompt: () => setAuthPromptOpen(true),
        refreshUser,
        updateRoles,
      }}
    >
      {children}
      <AuthPromptModal open={authPromptOpen} onClose={() => setAuthPromptOpen(false)} />
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
