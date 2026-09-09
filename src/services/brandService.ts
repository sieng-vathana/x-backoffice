import { api } from '../lib/api'
import type { ApiResponse, PageResponse } from '../types/auth'
import type { BrandResponse, CreateBrandRequest } from '../types/brand'

export const brandService = {
  async getBrands(businessId = 1): Promise<BrandResponse[]> {
    try {
      const res = await api.request<ApiResponse<PageResponse<BrandResponse>>>(
        `/products/brands?businessId=${businessId}&page=0&size=100`
      )
      return res.data?.content ?? []
    } catch {
      return []
    }
  },

  async createBrand(input: CreateBrandRequest, businessId = 1): Promise<BrandResponse> {
    const res = await api.request<ApiResponse<BrandResponse>>('/products/brands', {
      method: 'POST',
      body: JSON.stringify({
        businessId,
        name: input.name,
        code: input.code,
        logoUrl: input.logoUrl,
        description: input.description,
      }),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to create brand.')
    }
    return res.data
  },

  async updateBrand(id: number, input: CreateBrandRequest, businessId = 1): Promise<BrandResponse> {
    const res = await api.request<ApiResponse<BrandResponse>>(`/products/brands/${id}?businessId=${businessId}`, {
      method: 'PUT',
      body: JSON.stringify({
        businessId,
        name: input.name,
        code: input.code,
        logoUrl: input.logoUrl,
        description: input.description,
      }),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to update brand.')
    }
    return res.data
  },

  async deleteBrand(id: number, businessId = 1): Promise<void> {
    await api.request<void>(`/products/brands/${id}?businessId=${businessId}`, {
      method: 'DELETE',
    })
  },
}
