export interface BrandResponse {
  id: number
  businessId?: number
  name: string
  code?: string
  logoUrl?: string
  description?: string
  status?: string
  isPlatform?: boolean
  isFeatured?: boolean
  isGlobal?: boolean
  storeIds?: number[]
}

export interface CreateBrandRequest {
  name: string
  code?: string
  logoUrl?: string
  description?: string
  isFeatured?: boolean
  isGlobal?: boolean
  status?: string
  storeIds?: number[]
}
