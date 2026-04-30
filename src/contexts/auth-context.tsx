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
  // true only when there's a stored refresh token that needs to be validated
  const [initializing, setInitializing] = useState(() => !!getStoredRefreshToken())
  const [authPromptOpen, setAuthPromptOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null)
      navigate('/login', { replace: true })
    })

    if (!getStoredRefreshToken()) return

    let cancelled = false
    refreshAccessToken()
      .then((token) => {
        if (!cancelled) setUser(userFromToken(token))
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
    navigate('/login', { replace: true })
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
