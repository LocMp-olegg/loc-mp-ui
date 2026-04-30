import { Check, X } from 'lucide-react'
import { pwdRules } from '@/lib/auth-validation'

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  return (
    <div className="mt-2 space-y-1">
      {pwdRules.map((r) => {
        const ok = r.test(password)
        return (
          <div key={r.label} className="flex items-center gap-1.5">
            {ok ? (
              <Check className="w-3.5 h-3.5 text-primary shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 text-nav-text/35 shrink-0" />
            )}
            <span className={`text-xs ${ok ? 'text-primary' : 'text-nav-text/45'}`}>{r.label}</span>
          </div>
        )
      })}
    </div>
  )
}
