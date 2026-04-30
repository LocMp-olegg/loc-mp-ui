import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Loader2,
  Store,
  ShoppingBag,
  User,
  Mail,
  Lock,
  Phone,
  AtSign,
  MapPin,
  Eye,
  EyeOff,
  ChevronLeft,
} from 'lucide-react'
import { ShimmerButton } from '@/components/aceternity/shimmer-button'
import { GlowInput } from '@/components/ui/glow-input'
import { Label, FieldError, Divider } from '@/components/auth/form-helpers'
import { PasswordStrength } from '@/components/auth/password-strength'
import { DatePickerField } from '@/components/auth/date-picker-field'
import { AddressPicker } from '@/components/auth/address-picker'
import {
  validateRegister,
  validateStep1,
  passwordValid,
  formatPhone,
  emptyRegisterForm,
  type RegisterErrors,
  type RegisterFormData,
} from '@/lib/auth-validation'
import { useAuth } from '@/contexts/auth-context'
import type { GeoSuggestion } from '@/lib/geo'
import { SelectDropdown } from '@/components/ui/select-dropdown'
import * as React from 'react'

const slideVariants = {
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -40, opacity: 0 }),
}

function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div className="mb-1">
      <div className="flex justify-between text-xs mb-1.5">
        <span className={step === 1 ? 'text-nav-text/80' : 'text-nav-text/65'}>Основное</span>
        <span className={step === 2 ? 'text-nav-text/80' : 'text-nav-text/65'}>Опционально</span>
      </div>
      <div className="flex gap-1.5">
        <div className="h-1 flex-1 rounded-full bg-primary" />
        <div
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-primary' : 'bg-white/15'}`}
        />
      </div>
    </div>
  )
}

const REGISTER_SESSION_KEY = 'register-form-draft'

function loadRegisterDraft() {
  try {
    return JSON.parse(sessionStorage.getItem(REGISTER_SESSION_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
  const draft = React.useMemo(() => loadRegisterDraft(), [])
  const [form, setForm] = useState<RegisterFormData>(() => draft?.form ?? emptyRegisterForm())
  const [step, setStep] = useState<1 | 2>(() => draft?.step ?? 1)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [touched, setTouched] = useState<Partial<Record<keyof RegisterErrors, boolean>>>(
    () => draft?.touched ?? {},
  )
  const [addressQuery, setAddressQuery] = useState<string>(() => draft?.addressQuery ?? '')
  const [addressConfirmed, setAddressConfirmed] = useState<boolean>(
    () => draft?.addressConfirmed ?? true,
  )
  const [addressTouched, setAddressTouched] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sessionStorage.setItem(
      REGISTER_SESSION_KEY,
      JSON.stringify({ form, step, touched, addressQuery, addressConfirmed }),
    )
  }, [form, step, touched, addressQuery, addressConfirmed])

  const set = <K extends keyof RegisterFormData>(k: K, v: RegisterFormData[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const touch = (field: keyof RegisterErrors) => setTouched((t) => ({ ...t, [field]: true }))

  const revalidate = (next: RegisterFormData) => setErrors(validateRegister(next))

  const handleChange = (k: keyof RegisterErrors, v: string) => {
    const next = { ...form, [k]: v } as RegisterFormData
    setForm(next)
    if (Object.keys(touched).length > 0) revalidate(next)
  }

  const handleAddressQueryChange = (q: string) => {
    setAddressQuery(q)
    setAddressConfirmed(q.length === 0)
    setForm((f) => ({ ...f, lat: null, lng: null, addressLabel: '' }))
  }

  const handleAddressSelect = (s: GeoSuggestion) => {
    setAddressQuery(s.label)
    setAddressConfirmed(true)
    setForm((f) => ({ ...f, lat: s.lat, lng: s.lng, addressLabel: s.label }))
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      setForm((f) => ({ ...f, phoneNumber: f.phoneNumber.slice(0, -1) }))
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allDigits = e.target.value.replace(/\D/g, '')
    const digits = allDigits.startsWith('7') ? allDigits.slice(1) : allDigits
    handleChange('phoneNumber', digits.slice(0, 10))
  }

  const handleNext = () => {
    setTouched({ firstName: true, lastName: true, userName: true, email: true, password: true })
    const errs = validateStep1(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setDirection(1)
    setStep(2)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep(1)
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const addressErr = !addressConfirmed && addressQuery.length > 0
    if (addressErr) setAddressTouched(true)
    if (addressErr) return
    setLoading(true)
    setServerError(null)
    try {
      sessionStorage.removeItem(REGISTER_SESSION_KEY)
      sessionStorage.removeItem('auth-tab')
      await register({
        userName: form.userName,
        email: form.email,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber || undefined,
        isSeller: form.isSeller,
        latitude: form.lat ?? undefined,
        longitude: form.lng ?? undefined,
        birthDate: form.birthDate || undefined,
        gender: form.gender || undefined,
      })
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <StepBar step={step} />

      {serverError && (
        <div className="rounded-xl bg-red-500/10 border border-red-400/30 px-4 py-3 text-sm text-red-400">
          {serverError}
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {step === 1 ? (
          <motion.div
            key="step1"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <Label>Кто вы?</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { key: false, icon: ShoppingBag, title: 'Покупатель' },
                    { key: true, icon: Store, title: 'Продавец' },
                  ] as const
                ).map(({ key, icon: Icon, title }) => (
                  <button
                    key={String(key)}
                    type="button"
                    onClick={() => set('isSeller', key)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                      form.isSeller === key
                        ? 'border-border/20 hover:border-border/30 bg-primary text-nav-text/80 hover:text-nav-text'
                        : 'border-border/40 hover:border-border/50 text-nav-text/80 hover:text-nav-text bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {title}
                  </button>
                ))}
              </div>
            </div>

            <Divider label="личные данные" />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Имя</Label>
                <GlowInput
                  icon={User}
                  type="text"
                  autoComplete="given-name"
                  placeholder="Иван"
                  value={form.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  onBlur={() => {
                    touch('firstName')
                    revalidate(form)
                  }}
                  onClear={() => handleChange('firstName', '')}
                  error={touched.firstName ? errors.firstName : undefined}
                />
                {touched.firstName && <FieldError msg={errors.firstName} />}
              </div>
              <div>
                <Label>Фамилия</Label>
                <GlowInput
                  type="text"
                  autoComplete="family-name"
                  placeholder="Петров"
                  value={form.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  onBlur={() => {
                    touch('lastName')
                    revalidate(form)
                  }}
                  onClear={() => handleChange('lastName', '')}
                  error={touched.lastName ? errors.lastName : undefined}
                />
                {touched.lastName && <FieldError msg={errors.lastName} />}
              </div>
            </div>

            <div>
              <Label>Логин</Label>
              <GlowInput
                icon={AtSign}
                type="text"
                autoComplete="username"
                placeholder="ivan_petrov"
                value={form.userName}
                onChange={(e) => handleChange('userName', e.target.value)}
                onBlur={() => {
                  touch('userName')
                  revalidate(form)
                }}
                onClear={() => handleChange('userName', '')}
                error={touched.userName ? errors.userName : undefined}
              />
              {touched.userName && <FieldError msg={errors.userName} />}
            </div>

            <div>
              <Label>Email</Label>
              <GlowInput
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder="ivan@example.com"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => {
                  touch('email')
                  revalidate(form)
                }}
                onClear={() => handleChange('email', '')}
                error={touched.email ? errors.email : undefined}
              />
              {touched.email && <FieldError msg={errors.email} />}
            </div>

            <div>
              <Label>Пароль</Label>
              <GlowInput
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => {
                  touch('password')
                  revalidate(form)
                }}
                onClear={() => handleChange('password', '')}
                error={
                  touched.password && !passwordValid(form.password) && form.password.length > 0
                    ? errors.password
                    : touched.password && !form.password
                      ? errors.password
                      : undefined
                }
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
              <PasswordStrength password={form.password} />
              {touched.password && !form.password && <FieldError msg={errors.password} />}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/80 transition-colors cursor-pointer"
            >
              Далее →
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div>
              <Label>Телефон </Label>
              <GlowInput
                icon={Phone}
                type="tel"
                autoComplete="tel-national"
                placeholder="+7(900)-123-45-67"
                value={formatPhone(form.phoneNumber)}
                onChange={handlePhoneChange}
                onKeyDown={handlePhoneKeyDown}
                onBlur={() => {
                  touch('phoneNumber')
                  revalidate(form)
                }}
                onClear={() => handleChange('phoneNumber', '')}
                error={touched.phoneNumber ? errors.phoneNumber : undefined}
              />
              {touched.phoneNumber && <FieldError msg={errors.phoneNumber} />}
            </div>

            <div className="grid grid-cols-2 gap-3 items-start">
              <div>
                <Label>Дата рождения </Label>
                <DatePickerField value={form.birthDate} onChange={(iso) => set('birthDate', iso)} />
              </div>
              <div>
                <Label>Пол</Label>
                <SelectDropdown
                  options={[
                    { value: '', label: 'Не указан' },
                    { value: 'Male', label: 'Мужской' },
                    { value: 'Female', label: 'Женский' },
                  ]}
                  value={form.gender}
                  onChange={(v) => set('gender', v as RegisterFormData['gender'])}
                  placeholder="Не указан"
                />
              </div>
            </div>

            <Divider label="местоположение" />

            <div>
              <Label>Адрес </Label>
              <AddressPicker
                query={addressQuery}
                onQueryChange={handleAddressQueryChange}
                onSelect={handleAddressSelect}
                onBlur={() => setAddressTouched(true)}
                error={
                  addressTouched && !addressConfirmed && addressQuery.length > 0
                    ? 'Выберите адрес из предложенных вариантов'
                    : undefined
                }
              />
              {form.addressLabel && (
                <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {form.addressLabel}
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleBack}
                className="h-11 px-4 rounded-xl border border-border/40 text-nav-text/60 hover:text-nav-text hover:border-primary/40 text-sm font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Назад
              </button>
              <ShimmerButton
                type="submit"
                disabled={loading}
                className="flex-1 h-11 text-sm font-semibold"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Создать аккаунт'}
              </ShimmerButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-sm text-nav-text/80">
        Уже есть аккаунт?{' '}
        <button
          type="button"
          onClick={onSwitch}
          className="text-primary hover:underline font-medium cursor-pointer"
        >
          Войти
        </button>
      </p>
    </form>
  )
}
