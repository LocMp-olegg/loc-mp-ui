import { useEffect, useCallback, type ReactNode, type InputHTMLAttributes } from 'react'
import { animate, motion, useMotionValue, useMotionTemplate } from 'framer-motion'
import { X, type LucideIcon } from 'lucide-react'
import * as React from 'react'

export function GlowWrapper({ children, error }: { children: ReactNode; error?: string }) {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const radius = useMotionValue(0)

  const gradientBg = useMotionTemplate`radial-gradient(${radius}px circle at ${mouseX}px ${mouseY}px, color-mix(in srgb, var(--primary) 22%, transparent), transparent 90%)`

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = e.currentTarget.getBoundingClientRect()
      mouseX.set(e.clientX - left)
      mouseY.set(e.clientY - top)
    },
    [mouseX, mouseY],
  )

  const handleMouseEnter = useCallback(() => {
    void animate(radius, 110, { duration: 0.25, ease: 'easeOut' })
  }, [radius])

  const handleMouseLeave = useCallback(() => {
    void animate(radius, 0, { duration: 0.3, ease: 'easeIn' })
  }, [radius])

  useEffect(() => {
    if (error) void animate(radius, 0, { duration: 0.15, ease: 'easeIn' })
  }, [error, radius])

  return (
    <div className="relative">
      <motion.div
        onMouseMove={error ? undefined : handleMouseMove}
        onMouseEnter={error ? undefined : handleMouseEnter}
        onMouseLeave={error ? undefined : handleMouseLeave}
        style={{ background: gradientBg }}
        className="rounded-xl p-[1.5px] bg-border/0"
      >
        {children}
      </motion.div>
      {error && (
        <div className="pointer-events-none absolute inset-0 rounded-xl shadow-[inset_0_0_0_1.5px_rgba(239,68,68,0.45)]" />
      )}
    </div>
  )
}

export function GlowInput({
  icon: Icon,
  error,
  onClear,
  rightSlot,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & {
  icon?: LucideIcon
  error?: string
  onClear?: () => void
  rightSlot?: ReactNode
}) {
  const plClass = Icon ? 'pl-10' : 'pl-4'
  const hasRight = rightSlot !== undefined
  const hasClearPossible = onClear !== undefined
  const prClass =
    hasRight && hasClearPossible ? 'pr-16' : hasRight || hasClearPossible ? 'pr-10' : 'pr-4'

  return (
    <GlowWrapper error={error}>
      <div className="relative rounded-[10px] overflow-hidden">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-nav-text/85 pointer-events-none z-10" />
        )}
        <input
          {...rest}
          style={{ boxShadow: 'var(--shadow-input)' }}
          className={`w-full h-11 text-sm text-nav-text placeholder:text-nav-text/45 outline-none rounded-[10px] transition-colors ${plClass} ${prClass} bg-white/10`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10">
          {onClear && !!rest.value && (
            <button
              type="button"
              onClick={onClear}
              className="text-nav-text/75 hover:text-nav-text transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {rightSlot}
        </div>
      </div>
    </GlowWrapper>
  )
}
