import { api } from '../lib/api'
import type { ApiResponse, PageResponse } from '../types/auth'
import type { ReviewMarketplaceRequest, StoreResponse } from '../types/store'

export const storeService = {
  async getPendingMarketplaceStores(): Promise<StoreResponse[]> {
    const res = await api.request<ApiResponse<StoreResponse[]>>('/stores/marketplace/pending')
    return res.data ?? []
  },

  async approveMarketplaceStore(id: number): Promise<StoreResponse> {
    const res = await api.request<ApiResponse<StoreResponse>>(`/stores/${id}/marketplace/approve`, {
      method: 'POST',
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to approve store.')
    }
    return res.data
  },

  async rejectMarketplaceStore(id: number, reason?: string): Promise<StoreResponse> {
    const body: ReviewMarketplaceRequest = { reason }
    const res = await api.request<ApiResponse<StoreResponse>>(`/stores/${id}/marketplace/reject`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (!res.data) {
      throw new Error(res.message || 'Failed to reject store.')
    }
    return res.data
  },

  async getStoreById(id: number): Promise<StoreResponse> {
    const res = await api.request<ApiResponse<StoreResponse>>(`/stores/${id}`)
    if (!res.data) {
      throw new Error(res.message || 'Store not found.')
    }
    return res.data
  },

  async getStoresByBusiness(businessId: number, page = 0, size = 50): Promise<PageResponse<StoreResponse>> {
    const res = await api.request<ApiResponse<PageResponse<StoreResponse>>>(
      `/stores?businessId=${businessId}&page=${page}&size=${size}`
    )
    return (
      res.data ?? {
        content: [],
        page: 0,
        size,
        totalElements: 0,
        totalPages: 0,
        hasNext: false,
      }
    )
  },

  async getPublicStores(ids: number[]): Promise<StoreResponse[]> {
    if (ids.length === 0) return []
    const query = ids.map((id) => `ids=${id}`).join('&')
    const res = await api.request<ApiResponse<StoreResponse[]>>(`/stores/public?${query}`)
    return res.data ?? []
  },
}
