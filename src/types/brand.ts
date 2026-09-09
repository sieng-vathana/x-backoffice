export interface BrandResponse {
  id: number
  businessId?: number
  name: string
  code?: string
  logoUrl?: string
  description?: string
  status?: string
  isPlatform?: boolean
}

export interface CreateBrandRequest {
  name: string
  code?: string
  logoUrl?: string
  description?: string
}
