import { Check, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageStatusIconProps {
  isRead: boolean | undefined
  className?: string
}

export function MessageStatusIcon({ isRead, className }: MessageStatusIconProps) {
  if (isRead) {
    return <CheckCheck className={cn('w-3.5 h-3.5 text-primary-foreground/70', className)} />
  }
  return <Check className={cn('w-3.5 h-3.5 text-primary-foreground/50', className)} />
}
