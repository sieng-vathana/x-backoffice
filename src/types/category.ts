export interface MarketplaceCategoryResponse {
  id: number
  name: string
  code?: string
  image?: string
  featured?: boolean
  businessId?: number
  description?: string
  sortOrder?: number
  isGlobal?: boolean
  status?: string
  storeIds?: number[]
}

export interface CreateCategoryRequest {
  name: string
  code?: string
  image?: string
  featured?: boolean
  description?: string
  sortOrder?: number
  isGlobal?: boolean
  status?: string
  storeIds?: number[]
}
