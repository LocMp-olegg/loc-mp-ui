export interface Product {
  id: string
  name: string
  price: number
  unit: string
  shopId: string
  shopName: string
  categoryId: string
  images: string[]
  rating: number
  reviewCount: number
  /** Product enabled/disabled by the seller manually */
  isActive: boolean
  /** Shop enabled/disabled by the seller */
  shopIsActive: boolean
  /** true when isActive && shopIsActive && (stockQuantity > 0 || isMadeToOrder) */
  isAvailable: boolean
  stockQuantity: number
  isMadeToOrder: boolean
  location: string
  tags?: string[]
}

export interface Category {
  id: string
  name: string
  emoji: string
  products: Product[]
}
