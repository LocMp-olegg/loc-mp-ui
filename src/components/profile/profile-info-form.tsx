import { useState } from 'react'
import * as React from 'react'
import { Check, Loader2, Phone, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DatePickerField } from '@/components/auth/date-picker-field'
import { ProfileSelect } from '@/components/ui/profile-select'
import { formatPhone, PHONE_RE } from '@/lib/auth-validation'
import type { UserProfileDto, UpdateProfileData } from '@/hooks/use-profile'

interface ProfileInfoFormProps {
  profile: UserProfileDto
  onSave: (data: UpdateProfileData) => Promise<unknown>
}

const inputClass =
  'w-full h-10 px-3 text-sm text-foreground bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all placeholder:text-muted-foreground'

const labelClass = 'block text-xs font-medium text-muted-foreground mb-1.5'

const GENDER_OPTIONS = [
  { value: '', label: 'Не указан' },
  { value: 'Male', label: 'Мужской' },
  { value: 'Female', label: 'Женский' },
]

export function ProfileInfoForm({ profile, onSave }: ProfileInfoFormProps) {
  const [firstName, setFirstName] = useState(profile.firstName ?? '')
  const [lastName, setLastName] = useState(profile.lastName ?? '')
  const [gender, setGender] = useState<'Male' | 'Female' | ''>(profile.gender ?? '')
  const [birthDate, setBirthDate] = useState(profile.birthDate ?? '')
  const [phoneDigits, setPhoneDigits] = useState(() =>
    (profile.phoneNumber ?? '').replace(/\D/g, '').replace(/^7/, '').slice(0, 10),
  )
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const phoneError =
    phoneTouched && phoneDigits.length > 0 && !PHONE_RE.test(phoneDigits)
      ? 'Введите все 10 цифр номера'
      : undefined

  const isDirty =
    firstName !== (profile.firstName ?? '') ||
    lastName !== (profile.lastName ?? '') ||
    gender !== (profile.gender ?? '') ||
    birthDate !== (profile.birthDate ?? '') ||
    phoneDigits !== (profile.phoneNumber ?? '').replace(/\D/g, '').replace(/^7/, '').slice(0, 10)

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allDigits = e.target.value.replace(/\D/g, '')
    const digits = allDigits.startsWith('7') ? allDigits.slice(1) : allDigits
    setPhoneDigits(digits.slice(0, 10))
  }

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault()
      setPhoneDigits((d) => d.slice(0, -1))
    }
  }

  const handleReset = () => {
    setFirstName(profile.firstName ?? '')
    setLastName(profile.lastName ?? '')
    setGender(profile.gender ?? '')
    setBirthDate(profile.birthDate ?? '')
    setPhoneDigits(
      (profile.phoneNumber ?? '').replace(/\D/g, '').replace(/^7/, '').slice(0, 10),
    )
    setPhoneTouched(false)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!isDirty || saving) return
    setPhoneTouched(true)
    if (phoneDigits.length > 0 && !PHONE_RE.test(phoneDigits)) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await onSave({
        firstName: firstName || null,
        lastName: lastName || null,
        gender: (gender as 'Male' | 'Female') || null,
        birthDate: birthDate || null,
        phoneNumber: phoneDigits ? `+7${phoneDigits}` : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Имя</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Иван"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Фамилия</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Иванов"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Телефон</label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="tel"
            value={formatPhone(phoneDigits)}
            onChange={handlePhoneChange}
            onKeyDown={handlePhoneKeyDown}
            onBlur={() => setPhoneTouched(true)}
            placeholder="+7 (999) 000-00-00"
            className={`${inputClass} pl-9 ${phoneDigits ? 'pr-9' : ''} ${phoneError ? 'border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20' : ''}`}
          />
          {phoneDigits && (
            <button
              type="button"
              onClick={() => {
                setPhoneDigits('')
                setPhoneTouched(false)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Пол</label>
          <ProfileSelect
            options={GENDER_OPTIONS}
            value={gender}
            onChange={(v) => setGender(v as 'Male' | 'Female' | '')}
            placeholder="Не указан"
          />
        </div>
        <div>
          <label className={labelClass}>Дата рождения</label>
          <DatePickerField value={birthDate} onChange={setBirthDate} variant="light" />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <AnimatePresence>
          {isDirty && !saving && (
            <motion.button
              type="button"
              onClick={handleReset}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="h-10 px-5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Отменить
            </motion.button>
          )}
        </AnimatePresence>
        <motion.button
          type="submit"
          disabled={saving || !isDirty}
          whileTap={{ scale: 0.97 }}
          className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-4 h-4" />
              Сохранено
            </>
          ) : (
            'Сохранить'
          )}
        </motion.button>
      </div>
    </form>
  )
}
