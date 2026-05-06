import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  UserAddressesService,
  type UserAddressDto,
  type CreateUserAddressRequest,
  type UpdateUserAddressRequest,
} from '@/api/identity'
import { useAuth } from '@/contexts/auth-context'

interface AddressesContextType {
  addresses: UserAddressDto[]
  loading: boolean
  error: string | null
  createAddress: (data: CreateUserAddressRequest) => Promise<UserAddressDto>
  updateAddress: (id: string, data: UpdateUserAddressRequest) => Promise<UserAddressDto>
  deleteAddress: (id: string) => Promise<void>
  setDefault: (id: string) => Promise<void>
}

const AddressesContext = createContext<AddressesContextType | null>(null)

export function AddressesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [addresses, setAddresses] = useState<UserAddressDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setAddresses([])
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    UserAddressesService.getApiIdentityProfileAddresses()
      .then((data) => { if (!cancelled) setAddresses(data) })
      .catch(() => { if (!cancelled) setError('Не удалось загрузить адреса') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isAuthenticated])

  const createAddress = useCallback(async (data: CreateUserAddressRequest): Promise<UserAddressDto> => {
    const created = await UserAddressesService.postApiIdentityProfileAddresses({ requestBody: data })
    setAddresses((prev) =>
      data.isDefault
        ? [...prev.map((a) => ({ ...a, isDefault: false })), created]
        : [...prev, created],
    )
    return created
  }, [])

  const updateAddress = useCallback(
    async (id: string, data: UpdateUserAddressRequest): Promise<UserAddressDto> => {
      const updated = await UserAddressesService.putApiIdentityProfileAddresses({
        addressId: id,
        requestBody: data,
      })
      setAddresses((prev) => prev.map((a) => (a.id === id ? updated : a)))
      return updated
    },
    [],
  )

  const deleteAddress = useCallback(async (id: string): Promise<void> => {
    await UserAddressesService.deleteApiIdentityProfileAddresses({ addressId: id })
    setAddresses((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const setDefault = useCallback(async (id: string): Promise<void> => {
    await UserAddressesService.postApiIdentityProfileAddressesSetDefault({ addressId: id })
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
  }, [])

  return (
    <AddressesContext.Provider value={{ addresses, loading, error, createAddress, updateAddress, deleteAddress, setDefault }}>
      {children}
    </AddressesContext.Provider>
  )
}

export function useAddresses(): AddressesContextType {
  const ctx = useContext(AddressesContext)
  if (!ctx) throw new Error('useAddresses must be used within AddressesProvider')
  return ctx
}
