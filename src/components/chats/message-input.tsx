import { useState, useRef, useCallback } from 'react'
import { SendHorizonal, Paperclip } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AttachmentPreviews } from './attachment-previews'

const MAX_BODY_LENGTH = 4000
const MAX_ATTACHMENTS = 5

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const ALLOWED_TYPES = new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES])
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_VIDEO_BYTES = 100 * 1024 * 1024

function validateFiles(
  incoming: File[],
  existing: File[],
): { valid: File[]; error: string | null } {
  const available = MAX_ATTACHMENTS - existing.length
  if (available <= 0) {
    return { valid: [], error: `Максимум ${MAX_ATTACHMENTS} вложений` }
  }

  const errors: string[] = []
  const valid: File[] = []

  for (const f of incoming.slice(0, available)) {
    if (!ALLOWED_TYPES.has(f.type)) {
      errors.push(`${f.name}: неподдерживаемый тип`)
      continue
    }
    const isVideo = ALLOWED_VIDEO_TYPES.includes(f.type)
    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES
    if (f.size > maxBytes) {
      errors.push(`${f.name}: превышен размер (макс. ${isVideo ? 100 : 10} МБ)`)
      continue
    }
    valid.push(f)
  }

  return { valid, error: errors.length > 0 ? errors.join('; ') : null }
}

interface MessageInputProps {
  onSend: (body: string, files: File[]) => Promise<void>
  onTyping: () => void
  disabled?: boolean
}

export function MessageInput({ onSend, onTyping, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canSend =
    (value.trim().length > 0 || files.length > 0) &&
    value.length <= MAX_BODY_LENGTH &&
    !sending &&
    !disabled

  const resize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    resize()
    onTyping()
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (incoming.length === 0) return

    const { valid, error } = validateFiles(incoming, files)
    setFileError(error)
    if (valid.length > 0) setFiles((prev) => [...prev, ...valid])
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setFileError(null)
  }

  const handleSend = useCallback(async () => {
    if (!canSend) return
    const body = value.trim()
    const toSend = [...files]
    setValue('')
    setFiles([])
    setFileError(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSending(true)
    try {
      await onSend(body, toSend)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [canSend, value, files, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="border-t border-border/50 bg-card/40 backdrop-blur-sm shrink-0">
      <AttachmentPreviews files={files} onRemove={removeFile} />

      {fileError && <p className="text-xs text-destructive px-4 pt-1">{fileError}</p>}

      <div className="flex items-end gap-2 px-4 py-3">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={[...ALLOWED_TYPES].join(',')}
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Attach button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || files.length >= MAX_ATTACHMENTS}
          aria-label="Прикрепить файл"
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
            disabled || files.length >= MAX_ATTACHMENTS
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
          )}
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? 'Чат закрыт' : 'Написать сообщение…'}
          rows={1}
          maxLength={MAX_BODY_LENGTH}
          className={cn(
            'flex-1 resize-none rounded-xl border border-border bg-background/60 px-3 py-2.5',
            'text-sm text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-1 focus:ring-primary/50',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'min-h-[40px] max-h-32 overflow-y-auto transition-[height]',
          )}
        />

        {/* Send button */}
        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-label="Отправить"
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
            canSend
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
