import { api } from '../lib/api'
import type { ApiResponse } from '../types/auth'

export interface StoredMediaFile {
  id: number
  url: string
  originalName: string
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export function fileContentPath(fileId: number): string {
  return `/api/v1/files/${fileId}/content`
}

export const mediaService = {
  async uploadImage(file: File, ownerType: 'brand' | 'category', ownerId?: number): Promise<StoredMediaFile> {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new Error('Choose an image smaller than 5 MB.')
    }
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error('Choose a JPG, PNG, or WebP image.')
    }

    const form = new FormData()
    form.append('file', file)
    form.append('kind', 'media')
    form.append('ownerType', ownerType)
    if (ownerId !== undefined) form.append('ownerId', String(ownerId))

    const response = await api.request<ApiResponse<StoredMediaFile>>('/files', {
      method: 'POST',
      body: form,
    })
    if (!response.data?.id) {
      throw new Error(response.message || 'The image upload did not return a media record.')
    }
    return response.data
  },
}
