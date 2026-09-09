export interface MarketplaceCategoryResponse {
  id: number
  name: string
  code?: string
  image?: string
  featured?: boolean
}

export interface CreateCategoryRequest {
  name: string
  code?: string
  image?: string
  featured?: boolean
}
