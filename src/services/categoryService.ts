import { api } from '../lib/api'
import type { ApiResponse, PageResponse } from '../types/auth'
import type { CreateCategoryRequest, MarketplaceCategoryResponse } from '../types/category'

interface MarketplaceHomeData {
  categories?: MarketplaceCategoryResponse[]
}

export const categoryService = {
  async getMarketplaceCategories(): Promise<MarketplaceCategoryResponse[]> {
    try {
      const home = await api.request<ApiResponse<MarketplaceHomeData>>('/marketplace/home')
      if (home.data?.categories && home.data.categories.length > 0) {
        return home.data.categories
      }
    } catch {
      // fallback
    }

    try {
      const res = await api.request<ApiResponse<PageResponse<MarketplaceCategoryResponse>>>(
        '/products/categories?businessId=1&page=0&size=100'
      )
      return res.data?.content ?? []
    } catch {
      return []
    }
  },

  async createCategory(input: CreateCategoryRequest, businessId = 1): Promise<MarketplaceCategoryResponse> {
    const res = await api.request<ApiResponse<MarketplaceCategoryResponse>>('/products/categories', {
      method: 'POST',
      body: JSON.stringify({
        businessId,
        name: input.name,
        code: input.code,
        image: input.image,
        featured: input.featured ?? false,
      }),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to create category.')
    }
    return res.data
  },

  async updateCategory(
    id: number,
    input: CreateCategoryRequest,
    businessId = 1
  ): Promise<MarketplaceCategoryResponse> {
    const res = await api.request<ApiResponse<MarketplaceCategoryResponse>>(
      `/products/categories/${id}?businessId=${businessId}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          businessId,
          name: input.name,
          code: input.code,
          image: input.image,
          featured: input.featured ?? false,
        }),
      }
    )
    if (!res.data) {
      throw new Error(res.message || 'Failed to update category.')
    }
    return res.data
  },

  async deleteCategory(id: number, businessId = 1): Promise<void> {
    await api.request<void>(`/products/categories/${id}?businessId=${businessId}`, {
      method: 'DELETE',
    })
  },
}
