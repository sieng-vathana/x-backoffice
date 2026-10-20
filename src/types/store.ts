export interface StoreImageResponse {
  id?: number
  /** Store service serializes image references as `imageUrl`. `url` supports old cached responses. */
  imageUrl?: string
  url?: string
  fileId?: number | null
  isPrimary?: boolean
  sortOrder?: number | null
}

export type MarketplaceStatus = 'NOT_LISTED' | 'PENDING_REVIEW' | 'NEEDS_CHANGES' | 'APPROVED' | 'REJECTED'

export interface StoreOpeningHours {
  timeZone: string
  days: Record<string, { closed: boolean; openTime: string | null; closeTime: string | null }>
}

export interface StoreResponse {
  id: number
  businessId: number
  name: string
  code: string
  storeType: string
  salesChannel?: 'POS' | 'ONLINE' | 'BOTH' | null
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
  openingHours?: StoreOpeningHours | null
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
