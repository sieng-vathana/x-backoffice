export interface StoreImageResponse {
  id?: number
  url: string
  isPrimary?: boolean
}

export type MarketplaceStatus = 'NOT_LISTED' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'

export interface StoreResponse {
  id: number
  businessId: number
  name: string
  code: string
  storeType: string
  addressLine1?: string
  addressLine2?: string
  landmark?: string
  city?: string
  stateProvince?: string
  countryCode?: string
  postalCode?: string
  phone?: string
  alternatePhone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  images?: StoreImageResponse[]
  status?: number
  marketplaceStatus: MarketplaceStatus
  marketplaceAppliedAt?: string | null
  marketplaceApprovedAt?: string | null
  rejectionReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface ReviewMarketplaceRequest {
  reason?: string
}
