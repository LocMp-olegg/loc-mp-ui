import { Package, Headphones, Store, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatType } from '@/api/chat'

const CONFIG: Record<ChatType, { Icon: typeof Package; bg: string; fg: string }> = {
  Order: { Icon: Package, bg: 'bg-accent/20', fg: 'text-accent' },
  Support: { Icon: Headphones, bg: 'bg-purple-500/20', fg: 'text-purple-500' },
  Shop: { Icon: Store, bg: 'bg-primary/20', fg: 'text-primary' },
  Direct: { Icon: User, bg: 'bg-muted', fg: 'text-muted-foreground' },
}

interface ChatTypeAvatarProps {
  type: ChatType | undefined
  className?: string
}

export function ChatTypeAvatar({ type, className }: ChatTypeAvatarProps) {
  const { Icon, bg, fg } = CONFIG[type ?? 'Direct']
  return (
    <div
      className={cn(
        'w-11 h-11 rounded-xl shrink-0 flex items-center justify-center',
        bg,
        className,
      )}
    >
      <Icon className={cn('w-5 h-5', fg)} />
    </div>
  )
}
