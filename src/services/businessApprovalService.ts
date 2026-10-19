import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'

export interface BusinessApproval {
  id: number
  ownerUserId: number
  name: string
  code: string
  defaultCurrencyCode: string
  taxRegistrationNumber?: string | null
  taxRegistrationLabel?: string | null
  timeZone: string
  status: number
  reviewReason?: string | null
  createdAt?: string | null
}

export const businessApprovalService = {
  async pending(): Promise<BusinessApproval[]> {
    const response = await api.request<ApiResponse<BusinessApproval[]>>('/businesses/approvals/pending')
    return response.data ?? []
  },

  async approve(id: number): Promise<BusinessApproval> {
    const response = await api.request<ApiResponse<BusinessApproval>>(`/businesses/${id}/approval/approve`, { method: 'POST' })
    if (!response.data) throw new Error(response.message || 'Could not approve merchant.')
    return response.data
  },

  async reject(id: number, reason: string): Promise<BusinessApproval> {
    const response = await api.request<ApiResponse<BusinessApproval>>(`/businesses/${id}/approval/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
    if (!response.data) throw new Error(response.message || 'Could not reject merchant.')
    return response.data
  },
}
