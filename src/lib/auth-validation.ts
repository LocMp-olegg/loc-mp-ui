export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
export const PHONE_RE = /^\d{10}$/

export const pwdRules = [
  { label: 'Минимум 8 символов', test: (p: string) => p.length >= 8 },
  { label: 'Строчная буква', test: (p: string) => /[a-zа-яё]/u.test(p) },
  { label: 'Заглавная буква', test: (p: string) => /[A-ZА-ЯЁ]/u.test(p) },
  { label: 'Цифра', test: (p: string) => /\d/.test(p) },
  { label: 'Спецсимвол', test: (p: string) => /[^a-zA-Zа-яёА-ЯЁ0-9]/u.test(p) },
]

export function passwordValid(p: string) {
  return pwdRules.every((r) => r.test(p))
}

export interface LoginErrors {
  credential?: string
  password?: string
}

export interface RegisterErrors {
  firstName?: string
  lastName?: string
  userName?: string
  email?: string
  password?: string
  phoneNumber?: string
}

export interface RegisterFormData {
  firstName: string
  lastName: string
  userName: string
  email: string
  password: string
  phoneNumber: string
  isSeller: boolean
  lat: number | null
  lng: number | null
  addressLabel: string
  birthDate: string
  gender: 'Male' | 'Female' | ''
}

export function emptyRegisterForm(): RegisterFormData {
  return {
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    phoneNumber: '',
    isSeller: false,
    lat: null,
    lng: null,
    addressLabel: '',
    birthDate: '',
    gender: '',
  }
}

export function validateLogin(credential: string, password: string): LoginErrors {
  const e: LoginErrors = {}
  if (!credential.trim()) e.credential = 'Обязательное поле'
  if (!password) e.password = 'Обязательное поле'
  return e
}

export function validateStep1(f: RegisterFormData): RegisterErrors {
  const e: RegisterErrors = {}
  if (!f.firstName.trim()) e.firstName = 'Обязательное поле'
  if (!f.lastName.trim()) e.lastName = 'Обязательное поле'
  if (!f.userName.trim()) e.userName = 'Обязательное поле'
  else if (f.userName.length < 3) e.userName = 'Минимум 3 символа'
  else if (f.userName.length > 256) e.userName = 'Максимум 256 символов'
  if (!f.email.trim()) e.email = 'Обязательное поле'
  else if (!EMAIL_RE.test(f.email)) e.email = 'Некорректный email'
  if (!f.password) e.password = 'Обязательное поле'
  else if (!passwordValid(f.password)) e.password = 'Пароль не соответствует требованиям'
  return e
}

export function validateRegister(f: RegisterFormData): RegisterErrors {
  const e = validateStep1(f)
  if (f.phoneNumber && !PHONE_RE.test(f.phoneNumber)) e.phoneNumber = 'Введите все 10 цифр номера'
  return e
}

export function formatPhone(digits: string): string {
  if (!digits) return ''
  const d = digits.slice(0, 10)
  let r = '+7('
  r += d.slice(0, Math.min(3, d.length))
  if (d.length >= 3) r += ')'
  if (d.length > 3) r += '-' + d.slice(3, Math.min(6, d.length))
  if (d.length > 6) r += '-' + d.slice(6, Math.min(8, d.length))
  if (d.length > 8) r += '-' + d.slice(8, 10)
  return r
}
