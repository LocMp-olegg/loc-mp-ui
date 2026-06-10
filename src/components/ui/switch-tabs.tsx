import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SwitchTabsProps<K extends string> {
  tabs: readonly { key: K; label: string }[]
  active: K
  onChange: (tab: K) => void
  layoutId: string
  className?: string
}

export function SwitchTabs<K extends string>({
  tabs,
  active,
  onChange,
  layoutId,
  className,
}: SwitchTabsProps<K>) {
  return (
    <div className={cn('flex gap-1 p-1 rounded-2xl bg-muted/50', className)}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className="relative flex-1 h-9 rounded-xl text-sm font-medium cursor-pointer"
        >
          {active === key && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 rounded-xl bg-background shadow-sm"
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            />
          )}
          <span
            className={cn(
              'relative z-10 transition-colors duration-200',
              active === key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
