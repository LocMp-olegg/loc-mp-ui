import { cn } from '@/lib/utils'
import { MessageStatusIcon } from './message-status-icon'
import { MessageAttachments } from './message-attachments'
import { formatMessageTime } from '@/lib/chats'
import type { MessageDto } from '@/api/chat'

interface MessageBubbleProps {
  message: MessageDto
  isOwn: boolean
}

function SystemMessage({ body }: { body: string | null | undefined }) {
  return (
    <div className="flex justify-center my-1">
      <span className="text-xs text-muted-foreground bg-muted/60 px-3 py-1 rounded-full">
        {body}
      </span>
    </div>
  )
}

function Meta({
  sentAt,
  isOwn,
  isRead,
}: {
  sentAt: string | undefined
  isOwn: boolean
  isRead: boolean | undefined
}) {
  return (
    <div
      className={cn('flex items-center gap-0.5 mt-0.5', isOwn ? 'justify-end' : 'justify-start')}
    >
      <span
        className={cn(
          'text-[11px]',
          isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
        )}
      >
        {formatMessageTime(sentAt)}
      </span>
      {isOwn && <MessageStatusIcon isRead={isRead} />}
    </div>
  )
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  if (message.type === 'System') return <SystemMessage body={message.body} />

  const hasAttachments = (message.attachments?.length ?? 0) > 0
  const hasBody = !message.isDeleted && !!message.body?.trim()

  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-2xl overflow-hidden',
          hasAttachments && !hasBody ? 'w-full max-w-[75%]' : 'max-w-[72%]',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-card border border-border text-foreground rounded-bl-sm',
        )}
      >
        {!isOwn && message.senderName && (hasBody || !hasAttachments) && (
          <p
            className={cn(
              'text-xs font-semibold text-primary',
              hasAttachments ? 'px-3 pt-2' : 'px-3 pt-2 pb-0',
            )}
          >
            {message.senderName}
          </p>
        )}

        {hasAttachments && <MessageAttachments attachments={message.attachments!} />}

        <div className={hasAttachments && !hasBody ? 'px-2 pb-1 pt-0.5' : 'px-3 pb-2 pt-1.5'}>
          {message.isDeleted ? (
            <p className="text-sm italic opacity-50">Сообщение удалено</p>
          ) : hasBody ? (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message.body}
            </p>
          ) : null}

          <Meta sentAt={message.sentAt} isOwn={isOwn} isRead={message.isRead} />
        </div>
      </div>
    </div>
  )
}
