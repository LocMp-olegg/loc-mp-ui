export interface ShopDetail {
  id: string
  sellerId: string
  name: string
  sellerDisplayName: string | null
  description: string | null
  avatarUrl: string | null
  businessType: 'Individual' | 'SoleProprietor' | 'SmallBusiness' | null
  workingHours: string | null
  serviceRadiusKm: number | null
  allowCourierDelivery: boolean
  isVerified: boolean
  photos: string[]
}
