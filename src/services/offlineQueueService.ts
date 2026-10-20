import { api } from '../lib/api'

/** Cash sales waiting on POS computers, as each computer last reported them. */
export interface DeviceOfflineQueue {
  deviceId: string
  businessId: number
  storeId: number
  cashierId: number | null
  currencyCode: string
  waitingCount: number
  waitingTotal: number
  attentionCount: number
  reportedAt: string
}

export const offlineQueueService = {
  async all(): Promise<DeviceOfflineQueue[]> {
    const response = await api.request<{ data?: DeviceOfflineQueue[] }>('/businesses/offline-queue/all')
    return response.data ?? []
  },
}
