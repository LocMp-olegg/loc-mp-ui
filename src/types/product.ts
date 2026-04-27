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
  isAvailable: boolean
  stockQuantity: number
  isMadeToOrder: boolean
  location: string
}

export interface Category {
  id: string
  name: string
  emoji: string
  products: Product[]
}
