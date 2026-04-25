import { useCart } from '@/contexts/cart-context'
import { useFavorites } from '@/contexts/favorites-context'
import type { Product } from '@/types/product'
import * as React from "react";

interface ProductActions {
  quantity: number
  isFavorite: boolean
  onAdd: (e: React.MouseEvent) => void
  onDecrement: (e: React.MouseEvent) => void
  onIncrement: (e: React.MouseEvent) => void
  onToggleFavorite: (e: React.MouseEvent) => void
}

export function useProductActions(product: Product): ProductActions {
  const { addToCart, updateQuantity, items } = useCart()
  const { toggleFavorite, isFavorite } = useFavorites()

  const quantity = items.find((item) => item.product.id === product.id)?.quantity ?? 0

  const onAdd = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (product.isAvailable) addToCart(product)
  }

  const onDecrement = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, quantity - 1)
  }

  const onIncrement = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    updateQuantity(product.id, quantity + 1)
  }

  const onToggleFavorite = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
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
