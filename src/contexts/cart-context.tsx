import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from 'react'
import type { CartDto } from '@/api/orders'
import { CartsService } from '@/api/orders'
import { useAuth } from '@/contexts/auth-context'

type CartAction =
  | { type: 'clear' }
  | { type: 'loading' }
  | { type: 'loaded'; cart: CartDto }
  | { type: 'error' }
  | { type: 'update'; cart: CartDto }
  | { type: 'remove_optimistic'; cartItemId: string }

interface CartState {
  cart: CartDto | null
  isLoading: boolean
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'clear':
      return { cart: null, isLoading: false }
    case 'loading':
      return { ...state, isLoading: true }
    case 'loaded':
      return { cart: action.cart, isLoading: false }
    case 'error':
      return { cart: null, isLoading: false }
    case 'update':
      return { ...state, cart: action.cart }
    case 'remove_optimistic': {
      const prev = state.cart
      if (!prev?.groups) return state
      const groups = prev.groups
        .map((g) => {
          const items = (g.items ?? []).filter((i) => i.id !== action.cartItemId)
          const groupTotal = items.reduce((s, i) => s + (i.subtotal ?? 0), 0)
          return { ...g, items, groupTotal }
        })
        .filter((g) => (g.items ?? []).length > 0)
      return {
        ...state,
        cart: {
          ...prev,
          groups,
          totalAmount: groups.reduce((s, g) => s + (g.groupTotal ?? 0), 0),
        },
      }
    }
  }
}

interface CartContextType {
  cart: CartDto | null
  isLoading: boolean
  totalItems: number
  getItemQuantity: (productId: string) => number
  getCartItemId: (productId: string) => string | undefined
  addToCart: (productId: string, quantity?: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  refreshCart: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth()
  const [{ cart, isLoading }, dispatch] = useReducer(cartReducer, {
    cart: null,
    isLoading: false,
  })

  // Optimistic quantities: cartItemId → pending qty (shown while debounce is active)
  const [pendingQuantities, setPendingQuantities] = useState<Record<string, number>>({})
  // Ref holds the same data for reading inside async callbacks (avoids stale closures)
  const pendingValuesRef = useRef<Record<string, number>>({})
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    if (initializing) return
    if (!isAuthenticated) {
      dispatch({ type: 'clear' })
      return
    }
    let cancelled = false
    dispatch({ type: 'loading' })
    CartsService.getApiOrdersCarts()
      .then((data) => {
        if (!cancelled) dispatch({ type: 'loaded', cart: data })
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, initializing])

  const allItems = cart?.groups?.flatMap((g) => g.items ?? []) ?? []
  const totalItems = allItems.reduce((sum, item) => {
    const qty = pendingQuantities[item.id ?? ''] ?? item.quantity ?? 0
    return sum + qty
  }, 0)

  const getItemQuantity = (productId: string): number => {
    const item = allItems.find((i) => i.productId === productId)
    if (!item) return 0
    return pendingQuantities[item.id ?? ''] ?? item.quantity ?? 0
  }

  const getCartItemId = (productId: string): string | undefined =>
    allItems.find((i) => i.productId === productId)?.id

  const addToCart = async (productId: string, quantity = 1): Promise<void> => {
    const data = await CartsService.postApiOrdersCartsItems({
      requestBody: { productId, quantity },
    })
    dispatch({ type: 'update', cart: data })
  }

  const removeItem = async (cartItemId: string): Promise<void> => {
    // Cancel any pending debounced update for this item
    if (timersRef.current[cartItemId]) {
      clearTimeout(timersRef.current[cartItemId])
      delete timersRef.current[cartItemId]
    }
    delete pendingValuesRef.current[cartItemId]
    setPendingQuantities((prev) => {
      const next = { ...prev }
      delete next[cartItemId]
      return next
    })
    dispatch({ type: 'remove_optimistic', cartItemId })
    await CartsService.deleteApiOrdersCartsItems({ cartItemId })
  }

  const updateQuantity = (cartItemId: string, quantity: number): Promise<void> => {
    if (quantity <= 0) return removeItem(cartItemId)

    // Show new quantity immediately
    pendingValuesRef.current[cartItemId] = quantity
    setPendingQuantities((prev) => ({ ...prev, [cartItemId]: quantity }))

    // Debounce: reset timer on every click, fire one request after 500ms of quiet
    if (timersRef.current[cartItemId]) clearTimeout(timersRef.current[cartItemId])
    timersRef.current[cartItemId] = setTimeout(() => {
      delete timersRef.current[cartItemId]
      const finalQty = pendingValuesRef.current[cartItemId]
      if (finalQty === undefined) return
      delete pendingValuesRef.current[cartItemId]
      setPendingQuantities((prev) => {
        const next = { ...prev }
        delete next[cartItemId]
        return next
      })
      CartsService.putApiOrdersCartsItems({ cartItemId, requestBody: { quantity: finalQty } })
        .then((data) => dispatch({ type: 'update', cart: data }))
        .catch(() => {
          // Rollback: re-fetch authoritative state from server
          CartsService.getApiOrdersCarts()
            .then((data) => dispatch({ type: 'loaded', cart: data }))
            .catch(() => {})
        })
    }, 500)

    return Promise.resolve()
  }

  const refreshCart = async (): Promise<void> => {
    dispatch({ type: 'loading' })
    try {
      const data = await CartsService.getApiOrdersCarts()
      dispatch({ type: 'loaded', cart: data })
    } catch {
      dispatch({ type: 'error' })
    }
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        totalItems,
        getItemQuantity,
        getCartItemId,
        addToCart,
        removeItem,
        updateQuantity,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
