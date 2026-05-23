import { MessageSquare } from 'lucide-react'

interface ChatEmptyProps {
  message?: string
}

export function ChatEmpty({ message = 'Нет чатов' }: ChatEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
        <MessageSquare className="w-7 h-7 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
