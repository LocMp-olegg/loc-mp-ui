import type { Product } from './product'

export interface ProductDetail extends Product {
  sellerId: string
  description: string | null
  sellerName: string | null
  stockQuantity: number
  isMadeToOrder: boolean
  leadTimeDays: number | null
}

export interface ReviewItem {
  id: string
  reviewerName: string
  rating: number
  comment: string | null
  createdAt: string
  photos: string[]
  response: {
    id: string
    comment: string
    createdAt: string
    authorId: string
  } | null
}
