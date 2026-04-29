import type { ReactNode } from 'react'

export function FieldError({ msg }: { msg?: string }) {
  return msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-xs font-medium text-nav-text/80 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  )
}

export function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-white/32" />
      <span className="text-xs text-nav-text/80 shrink-0">{label}</span>
      <div className="flex-1 h-px bg-white/32" />
    </div>
  )
}
