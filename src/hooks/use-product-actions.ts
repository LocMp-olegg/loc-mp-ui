import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'
import { useAuth } from '@/contexts/auth-context'
import type { Product } from '@/types/product'
import * as React from 'react'

interface ProductActions {
  quantity: number
  isFavorite: boolean
  onAdd: (e: React.MouseEvent) => void
  onDecrement: (e: React.MouseEvent) => void
  onIncrement: (e: React.MouseEvent) => void
  onToggleFavorite: (e: React.MouseEvent) => void
}

export function useProductActions(product: Product): ProductActions {
  const { addToCart, removeItem, updateQuantity, getItemQuantity, getCartItemId } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()
  const { isAuthenticated, openAuthPrompt } = useAuth()

  const quantity = getItemQuantity(product.id)

  const onAdd = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      openAuthPrompt()
      return
    }
    if (product.isAvailable) void addToCart(product.id)
  }

  const onDecrement = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const cartItemId = getCartItemId(product.id)
    if (!cartItemId) return
    if (quantity <= 1) {
      void removeItem(cartItemId)
    } else {
      void updateQuantity(cartItemId, quantity - 1)
    }
  }

  const onIncrement = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const cartItemId = getCartItemId(product.id)
    if (!cartItemId) return
    void updateQuantity(cartItemId, quantity + 1)
  }

  const onToggleFavorite = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      openAuthPrompt()
      return
    }
    toggleFavorite(product.id)
  }

  return {
    quantity,
    isFavorite: isFavorite(product.id),
    onAdd,
    onDecrement,
    onIncrement,
    onToggleFavorite,
  }
}
