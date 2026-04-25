import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ShimmerButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function ShimmerButton({ children, className, disabled, ...props }: ShimmerButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        'group relative overflow-hidden rounded-xl bg-primary text-primary-foreground cursor-pointer',
        'transition-all duration-200 active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        className,
      )}
      {...props}
    >
      {!disabled && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        />
      )}
      <span className="relative z-10 flex items-center justify-center gap-1.5">{children}</span>
    </button>
  )
}
