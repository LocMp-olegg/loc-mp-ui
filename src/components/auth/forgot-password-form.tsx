import { useState } from 'react'
import { Mail, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { GlowInput } from '@/components/ui/glow-input'
import { Label, FieldError } from '@/components/auth/form-helpers'
import { AuthService } from '@/api/identity'
import { EMAIL_RE } from '@/lib/auth-validation'
import * as React from 'react'

export function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const emailError: string | undefined = touched
    ? !email.trim()
      ? 'Обязательное поле'
      : !EMAIL_RE.test(email)
        ? 'Некорректный email'
        : undefined
    : undefined

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched(true)
    if (!email.trim() || !EMAIL_RE.test(email)) return
    setLoading(true)
    setServerError(null)
    try {
      await AuthService.postApiIdentityAuthForgotPassword({ requestBody: { email } })
      setSent(true)
    } catch {
      setServerError('Не удалось отправить письмо. Попробуйте позже.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <CheckCircle2 className="w-10 h-10 text-primary" />
          <p className="text-sm text-nav-text/90">
            Если аккаунт с адресом <strong>{email}</strong> существует — письмо со ссылкой
            отправлено.
          </p>
          <p className="text-xs text-nav-text/55">
            Проверьте папку «Спам», если письмо не пришло.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-primary hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться ко входу
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-nav-text/75">
        Введите email, указанный при регистрации — мы отправим ссылку для сброса пароля.
      </p>

      {serverError && (
        <div className="rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <div>
        <Label>Email</Label>
        <GlowInput
          icon={Mail}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (touched) setTouched(true)
          }}
          onBlur={() => setTouched(true)}
          onClear={() => setEmail('')}
          error={emailError}
        />
        <FieldError msg={emailError} />
      </div>

      <ShimmerButton type="submit" disabled={loading} className="w-full h-11 text-sm font-semibold">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Отправить письмо'}
      </ShimmerButton>

      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-nav-text/65 hover:text-nav-text transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Вернуться ко входу
      </button>
    </form>
  )
}
