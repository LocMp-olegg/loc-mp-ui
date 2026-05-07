import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
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

interface State {
  addresses: UserAddressDto[]
  loading: boolean
  error: string | null
}

type Action =
  | { type: 'reset' }
  | { type: 'loading' }
  | { type: 'loaded'; data: UserAddressDto[] }
  | { type: 'error' }
  | { type: 'set'; updater: (prev: UserAddressDto[]) => UserAddressDto[] }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'reset':
      return { addresses: [], loading: false, error: null }
    case 'loading':
      return { ...state, loading: true, error: null }
    case 'loaded':
      return { addresses: action.data, loading: false, error: null }
    case 'error':
      return { ...state, loading: false, error: 'Не удалось загрузить адреса' }
    case 'set':
      return { ...state, addresses: action.updater(state.addresses) }
  }
}

const AddressesContext = createContext<AddressesContextType | null>(null)

export function AddressesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [{ addresses, loading, error }, dispatch] = useReducer(reducer, {
    addresses: [],
    loading: false,
    error: null,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'reset' })
      return
    }
    let cancelled = false
    dispatch({ type: 'loading' })
    UserAddressesService.getApiIdentityProfileAddresses()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'loaded', data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const createAddress = useCallback(
    async (data: CreateUserAddressRequest): Promise<UserAddressDto> => {
      const created = await UserAddressesService.postApiIdentityProfileAddresses({
        requestBody: data,
      })
      dispatch({
        type: 'set',
        updater: (prev) =>
          data.isDefault
            ? [...prev.map((a) => ({ ...a, isDefault: false })), created]
            : [...prev, created],
      })
      return created
    },
    [],
  )

  const updateAddress = useCallback(
    async (id: string, data: UpdateUserAddressRequest): Promise<UserAddressDto> => {
      const updated = await UserAddressesService.putApiIdentityProfileAddresses({
        addressId: id,
        requestBody: data,
      })
      dispatch({ type: 'set', updater: (prev) => prev.map((a) => (a.id === id ? updated : a)) })
      return updated
    },
    [],
  )

  const deleteAddress = useCallback(async (id: string): Promise<void> => {
    await UserAddressesService.deleteApiIdentityProfileAddresses({ addressId: id })
    dispatch({ type: 'set', updater: (prev) => prev.filter((a) => a.id !== id) })
  }, [])

  const setDefault = useCallback(async (id: string): Promise<void> => {
    await UserAddressesService.postApiIdentityProfileAddressesSetDefault({ addressId: id })
    dispatch({
      type: 'set',
      updater: (prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })),
    })
  }, [])

  return (
    <AddressesContext.Provider
      value={{ addresses, loading, error, createAddress, updateAddress, deleteAddress, setDefault }}
    >
      {children}
    </AddressesContext.Provider>
  )
}

export function useAddresses(): AddressesContextType {
  const ctx = useContext(AddressesContext)
  if (!ctx) throw new Error('useAddresses must be used within AddressesProvider')
  return ctx
}
