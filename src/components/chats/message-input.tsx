import React, { useState, useRef, useCallback, useEffect } from 'react'
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
  chatId: string
  onSend: (body: string, files: File[]) => Promise<void>
  onTyping: () => void
  disabled?: boolean
}

export function MessageInput({ chatId, onSend, onTyping, disabled = false }: MessageInputProps) {
  const [value, setValue] = useState(() => sessionStorage.getItem(`chat-draft-${chatId}`) ?? '')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef(value)

  // Keep ref in sync so the cleanup closure always sees the latest value
  useEffect(() => {
    valueRef.current = value
  })

  // On chatId change: save draft for old chat, restore for new chat
  useEffect(() => {
    const saved = sessionStorage.getItem(`chat-draft-${chatId}`) ?? ''
    setValue(saved)
    setFiles([])
    setFileError(null)
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (!ta) return
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`
    })
    return () => {
      const draft = valueRef.current.trim()
      if (draft) {
        sessionStorage.setItem(`chat-draft-${chatId}`, draft)
      } else {
        sessionStorage.removeItem(`chat-draft-${chatId}`)
      }
    }
  }, [chatId])

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
    sessionStorage.removeItem(`chat-draft-${chatId}`)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSending(true)
    try {
      await onSend(body, toSend)
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [canSend, value, files, chatId, onSend])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  return (
    <div className="px-3 pb-3 pt-1 shrink-0">
      <div
        className={cn(
          'rounded-2xl',
          'bg-nav-bg/70 backdrop-blur-xl',
          'border border-white/10',
          'shadow-[0_-4px_24px_rgba(0,0,0,0.12),inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        )}
      >
        <AttachmentPreviews files={files} onRemove={removeFile} />

        {fileError && <p className="text-xs text-destructive px-4 pt-2">{fileError}</p>}

        <div className="flex items-end gap-2 px-3 py-2.5">
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
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              disabled || files.length >= MAX_ATTACHMENTS
                ? 'text-nav-text/25 cursor-default'
                : 'text-nav-text/50 hover:text-nav-text hover:bg-white/10 cursor-pointer',
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
              'flex-1 resize-none rounded-xl px-3 py-2',
              'bg-white/8 border border-white/10',
              'text-sm text-nav-text placeholder:text-nav-text/40',
              'focus:outline-none focus:ring-1 focus:ring-primary/60 focus:border-primary/40',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'min-h-[36px] max-h-32 overflow-y-auto transition-[height] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            )}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            aria-label="Отправить"
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              canSend
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                : 'bg-white/8 text-nav-text/25 cursor-default',
            )}
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
