import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { GlowInput } from '@/components/ui/glow-input'
import { Label, FieldError } from '@/components/auth/form-helpers'
import { validateLogin, type LoginErrors } from '@/lib/auth-validation'
import { useAuth } from '@/contexts/auth-context'
import * as React from 'react'

const LOGIN_SESSION_KEY = 'login-form-draft'

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
  const [credential, setCredential] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(LOGIN_SESSION_KEY) ?? '{}').credential ?? ''
    } catch {
      return ''
    }
  })
  const [password, setPassword] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(LOGIN_SESSION_KEY) ?? '{}').password ?? ''
    } catch {
      return ''
    }
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [touched, setTouched] = useState({ credential: false, password: false })
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(LOGIN_SESSION_KEY, JSON.stringify({ credential, password }))
  }, [credential, password])

  const touch = (field: keyof typeof touched) => setTouched((t) => ({ ...t, [field]: true }))
  const revalidate = (c: string, p: string) => setErrors(validateLogin(c, p))

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched({ credential: true, password: true })
    const errs = validateLogin(credential, password)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setLoading(true)
    setServerError(null)
    try {
      await login(credential, password)
      sessionStorage.removeItem(LOGIN_SESSION_KEY)
      sessionStorage.removeItem('auth-tab')
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <div>
        <Label>Email или логин</Label>
        <GlowInput
          icon={Mail}
          type="text"
          autoComplete="username"
          placeholder="you@example.com"
          value={credential}
          onChange={(e) => {
            setCredential(e.target.value)
            if (touched.credential) revalidate(e.target.value, password)
          }}
          onBlur={() => {
            touch('credential')
            revalidate(credential, password)
          }}
          onClear={() => {
            setCredential('')
            if (touched.credential) revalidate('', password)
          }}
          error={touched.credential ? errors.credential : undefined}
        />
        {touched.credential && <FieldError msg={errors.credential} />}
      </div>

      <div>
        <Label>Пароль</Label>
        <GlowInput
          icon={Lock}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (touched.password) revalidate(credential, e.target.value)
          }}
          onBlur={() => {
            touch('password')
            revalidate(credential, password)
          }}
          onClear={() => {
            setPassword('')
            if (touched.password) revalidate(credential, '')
          }}
          error={touched.password ? errors.password : undefined}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              className="text-nav-text/80 hover:text-nav-text transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
        {touched.password && <FieldError msg={errors.password} />}
      </div>

      <ShimmerButton type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Войти'}
      </ShimmerButton>

      <p className="text-center text-sm text-nav-text/80">
        Нет аккаунта?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-primary hover:underline font-medium cursor-pointer"
        >
          Зарегистрироваться
        </button>
      </p>
    </form>
  )
}
