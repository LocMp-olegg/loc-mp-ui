import type { Product } from './product'

export interface ProductDetail extends Product {
  description: string | null
  sellerName: string | null
  stockQuantity: number
  isMadeToOrder: boolean
  leadTimeDays: number | null
  tags: string[]
}

export interface RatingAggregate {
  averageRating: number
  reviewCount: number
  oneStar: number
  twoStar: number
  threeStar: number
  fourStar: number
  fiveStar: number
}

export interface ReviewItem {
  id: string
  reviewerName: string
  rating: number
  comment: string | null
  createdAt: string
  photos: string[]
  response: { comment: string; createdAt: string } | null
}
