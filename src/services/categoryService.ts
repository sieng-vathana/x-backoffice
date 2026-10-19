import { api } from '../lib/api'
import type { ApiResponse, PageResponse } from '../types/auth'
import type { CreateCategoryRequest, MarketplaceCategoryResponse } from '../types/category'

const PLATFORM_BUSINESS_ID = 1

interface ProductCategoryRecord {
  id: number
  businessId: number
  storeIds?: number[]
  categoryCode: string
  categoryName: string
  description?: string
  image?: string
  sortOrder?: number
  isFeatured?: boolean
  isGlobal?: boolean
  status?: string
}

function catalogCode(value: string | undefined, name: string): string {
  const source = value?.trim() || name
  const normalized = source
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9_-]+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 50)

  return normalized || `CATEGORY_${Date.now().toString(36).toUpperCase()}`
}

function toCategory(record: ProductCategoryRecord): MarketplaceCategoryResponse {
  return {
    id: record.id,
    businessId: record.businessId,
    storeIds: record.storeIds,
    name: record.categoryName,
    code: record.categoryCode,
    image: record.image,
    featured: record.isFeatured,
    description: record.description,
    sortOrder: record.sortOrder,
    isGlobal: record.isGlobal,
    status: record.status,
  }
}

function toPayload(input: CreateCategoryRequest, businessId: number) {
  return {
    businessId,
    categoryCode: catalogCode(input.code, input.name),
    categoryName: input.name.trim(),
    description: input.description?.trim() || null,
    image: input.image?.trim() || null,
    sortOrder: input.sortOrder ?? 0,
    storeIds: input.storeIds ?? [],
    isFeatured: input.featured ?? false,
    isGlobal: input.isGlobal ?? true,
    status: input.status ?? 'ACTIVE',
  }
}

export const categoryService = {
  async getMarketplaceCategories(businessId = PLATFORM_BUSINESS_ID): Promise<MarketplaceCategoryResponse[]> {
    const res = await api.request<ApiResponse<PageResponse<ProductCategoryRecord>>>(
      `/products/categories?businessId=${businessId}&page=0&size=100`
    )
    return (res.data?.content ?? []).map(toCategory)
  },

  async createCategory(
    input: CreateCategoryRequest,
    businessId = PLATFORM_BUSINESS_ID
  ): Promise<MarketplaceCategoryResponse> {
    const res = await api.request<ApiResponse<ProductCategoryRecord>>('/products/categories', {
      method: 'POST',
      body: JSON.stringify(toPayload(input, businessId)),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to create category.')
    }
    return toCategory(res.data)
  },

  async updateCategory(
    id: number,
    input: CreateCategoryRequest,
    businessId = PLATFORM_BUSINESS_ID
  ): Promise<MarketplaceCategoryResponse> {
    const res = await api.request<ApiResponse<ProductCategoryRecord>>(
      `/products/categories/${id}?businessId=${businessId}`,
      {
        method: 'PUT',
        body: JSON.stringify(toPayload(input, businessId)),
      }
    )
    if (!res.data) {
      throw new Error(res.message || 'Failed to update category.')
    }
    return toCategory(res.data)
  },

  async deleteCategory(id: number, businessId = PLATFORM_BUSINESS_ID): Promise<void> {
    await api.request<void>(`/products/categories/${id}?businessId=${businessId}`, {
      method: 'DELETE',
    })
  },
}
