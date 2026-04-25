import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'

const THEMES = [
  { value: 'light', icon: Sun, label: 'Светлая' },
  { value: 'dark', icon: Moon, label: 'Тёмная' },
  { value: 'system', icon: Monitor, label: 'Системная' },
] as const

interface ThemeToggleProps {
  className?: string
  iconClassName?: string
}

export function ThemeToggle({ className, iconClassName }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()

  const currentIndex = THEMES.findIndex((t) => t.value === theme)
  const current = THEMES[currentIndex] ?? THEMES[2]
  const Icon = current.icon

  const handleClick = (): void => {
    const next = THEMES[(currentIndex + 1) % THEMES.length]
    setTheme(next.value)
  }

  return (
    <button
      onClick={handleClick}
      title={`Тема: ${current.label}`}
      aria-label={`Сменить тему (сейчас: ${current.label})`}
      className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors cursor-pointer',
        className,
      )}
    >
      <Icon className={cn('w-4 h-4 text-muted-foreground', iconClassName)} />
    </button>
  )
}
