import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { GlowInput } from '@/components/ui/glow-input'
import { Label, FieldError } from '@/components/auth/form-helpers'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { PasswordStrength } from '@/components/auth/password-strength'
import { AuthService } from '@/api/identity'
import { ApiError } from '@/api/identity/core/ApiError'
import { passwordValid } from '@/lib/auth-validation'
import * as React from 'react'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = () => setIsDesktop(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isDesktop
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const email = params.get('email') ?? ''
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [touched, setTouched] = useState({ password: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const passwordError: string | undefined = touched.password
    ? !password
      ? 'Обязательное поле'
      : !passwordValid(password)
        ? 'Пароль не соответствует требованиям'
        : undefined
    : undefined

  const confirmError: string | undefined = touched.confirm
    ? !confirm
      ? 'Обязательное поле'
      : confirm !== password
        ? 'Пароли не совпадают'
        : undefined
    : undefined

  const invalid = !token || !email

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched({ password: true, confirm: true })
    if (!password || !passwordValid(password) || confirm !== password) return
    setLoading(true)
    setServerError(null)
    try {
      await AuthService.postApiIdentityAuthResetPassword({
        requestBody: { email, token, newPassword: password },
      })
      setDone(true)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setServerError('Ссылка недействительна или срок её действия истёк')
      } else {
        setServerError('Ошибка сервера. Попробуйте ещё раз.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formContent = (() => {
    if (invalid) {
      return (
        <div className="text-center space-y-4 py-4">
          <p className="text-sm text-red-400">Недействительная ссылка для сброса пароля.</p>
          <Link to="/login" className="text-sm text-primary hover:underline">
            Вернуться ко входу
          </Link>
        </div>
      )
    }

    if (done) {
      return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
          <p className="text-sm text-nav-text/90">Пароль успешно изменён.</p>
          <ShimmerButton
            type="button"
            className="w-full h-11 text-sm font-semibold"
            onClick={() => navigate('/login')}
          >
            Войти
          </ShimmerButton>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-nav-text/75">
          Новый пароль для аккаунта <strong>{email}</strong>.
        </p>

        {serverError && (
          <div className="rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
            {serverError}
          </div>
        )}

        <div>
          <Label>Новый пароль</Label>
          <GlowInput
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (touched.password) setTouched((t) => ({ ...t, password: true }))
            }}
            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
            onClear={() => setPassword('')}
            error={passwordError}
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
          <FieldError msg={passwordError} />
          <PasswordStrength password={password} />
        </div>

        <div>
          <Label>Подтверждение пароля</Label>
          <GlowInput
            icon={Lock}
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value)
              if (touched.confirm) setTouched((t) => ({ ...t, confirm: true }))
            }}
            onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
            onClear={() => setConfirm('')}
            error={confirmError}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="text-nav-text/80 hover:text-nav-text transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <FieldError msg={confirmError} />
        </div>

        <ShimmerButton type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Сохранить пароль'}
        </ShimmerButton>
      </form>
    )
  })()

  const header = (
    <div className="flex items-center justify-between">
      <Link
        to="/login"
        className="flex items-center gap-1 text-sm text-nav-text/90 hover:text-nav-text transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Ко входу
      </Link>
      <ThemeToggle className="hover:bg-white/10" iconClassName="text-nav-text/90" />
    </div>
  )

  const title = (
    <h1 className="text-base font-semibold text-nav-text mb-4">Сброс пароля</h1>
  )

  if (!isDesktop) {
    return (
      <div className="min-h-screen px-4 py-8 flex flex-col items-center justify-center">
        <div className="dark w-full max-w-100 rounded-2xl bg-nav-bg/75 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-6 pt-5 pb-4">{header}</div>
          <div className="px-6 pb-6">
            {title}
            {formContent}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1" />
      <div className="dark w-135 shrink-0 min-h-screen flex flex-col bg-nav-bg/75 backdrop-blur-xl border-l border-white/10">
        <div className="shrink-0 px-8 pt-5 pb-4">{header}</div>
        <div className="flex-1 overflow-y-auto flex flex-col scrollbar-thin">
          <div className="my-auto w-full px-8 py-6">
            {title}
            {formContent}
          </div>
        </div>
      </div>
    </div>
  )
}
