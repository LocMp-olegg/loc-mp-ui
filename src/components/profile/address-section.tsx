import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { useAddresses } from '@/contexts/addresses-context'
import { AddressFormModal } from './address-form-modal'
import { cn } from '@/lib/utils'
import type {
  UserAddressDto,
  CreateUserAddressRequest,
  UpdateUserAddressRequest,
} from '@/api/identity'

function formatAddress(addr: UserAddressDto): string {
  const street = [addr.street, addr.houseNumber].filter(Boolean).join(', ')
  const apt = addr.apartment ? `кв. ${addr.apartment}` : ''
  return [street, apt].filter(Boolean).join(', ') || addr.city || ''
}

interface AddressCardProps {
  address: UserAddressDto
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
}

function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleDelete = async () => {
    setBusy(true)
    try {
      onDelete()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  const handleSetDefault = async () => {
    setBusy(true)
    try {
      onSetDefault()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:bg-muted/40 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <MapPin className="w-4 h-4 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">{address.title || 'Адрес'}</span>
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/12 text-primary border border-primary/25">
              <Star className="w-2.5 h-2.5 fill-current" />
              Основной
            </span>
          )}
        </div>
        {formatAddress(address) && (
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{formatAddress(address)}</p>
        )}
        {address.city && <p className="text-xs text-muted-foreground/70 mt-0.5">{address.city}</p>}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {!address.isDefault && (
          <button
            onClick={() => void handleSetDefault()}
            disabled={busy}
            title="Сделать основным"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Star className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={onEdit}
          title="Редактировать"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <AnimatePresence mode="wait">
          {confirming ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="flex items-center gap-1"
            >
              <button
                onClick={() => void handleDelete()}
                disabled={busy}
                className="px-2 h-7 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                Да
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 h-7 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                Нет
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="trash"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              onClick={() => setConfirming(true)}
              title="Удалить"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export function AddressSection() {
  const { addresses, loading, createAddress, updateAddress, deleteAddress, setDefault } =
    useAddresses()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserAddressDto | undefined>()

  const openAdd = () => {
    setEditing(undefined)
    setModalOpen(true)
  }

  const openEdit = (addr: UserAddressDto) => {
    setEditing(addr)
    setModalOpen(true)
  }

  const handleSave = async (
    data: CreateUserAddressRequest | UpdateUserAddressRequest,
  ): Promise<void> => {
    if (editing?.id) {
      await updateAddress(editing.id, data as UpdateUserAddressRequest)
    } else {
      await createAddress(data as CreateUserAddressRequest)
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-sm p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            Мои адреса
          </h2>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Добавить
          </button>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Нет сохранённых адресов</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Добавьте адрес для быстрого выбора в каталоге
            </p>
          </div>
        ) : (
          <div className={cn('space-y-2')}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                onEdit={() => openEdit(addr)}
                onDelete={() => deleteAddress(addr.id!)}
                onSetDefault={() => setDefault(addr.id!)}
              />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {modalOpen && (
          <AddressFormModal
            initial={editing}
            onClose={() => setModalOpen(false)}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </>
  )
}
