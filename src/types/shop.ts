export interface ShopAddress {
  city: string | null
  street: string | null
  houseNumber: string | null
  apartment: string | null
  entrance: string | null
  floor: string | null
}

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
  phone: string | null
  email: string | null
  inn: string | null
  createdAt: string | null
  address: ShopAddress | null
  latitude: number | null
  longitude: number | null
}
