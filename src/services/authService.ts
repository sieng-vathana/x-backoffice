import { api } from '../lib/api'
import { readStoredValue, writeStoredValue, removeStoredValue } from '../lib/storage'
import type { ApiResponse, AuthenticatedUser, SignInInput } from '../types/auth'

const AUTH_USER_KEY = 'x_backoffice_user'
export const AUTH_TOKEN_KEY = 'x_backoffice_token'

interface BackendAuthData {
  user?: {
    id: number
    username: string
    fullName?: string
    permissions?: string[]
  }
  accessToken?: string
  refreshToken?: string
}

function mapUser(data: BackendAuthData['user']): AuthenticatedUser {
  const permissions = data?.permissions ?? []
  const isPlatformAdmin =
    permissions.includes('platform:admin') ||
    permissions.includes('x-store:manage') ||
    data?.username === 'admin' ||
    data?.username === 'root' ||
    data?.username === 'sieng' ||
    permissions.length > 0 // Admins and operational users

  return {
    id: String(data?.id ?? ''),
    username: data?.username ?? '',
    fullName: data?.fullName ?? data?.username ?? '',
    permissions,
    isPlatformAdmin,
  }
}

export const authService = {
  getStoredUser(): AuthenticatedUser | null {
    return readStoredValue<AuthenticatedUser | null>(AUTH_USER_KEY, null)
  },

  getStoredToken(): string | null {
    return readStoredValue<string | null>(AUTH_TOKEN_KEY, null)
  },

  async login(input: SignInInput): Promise<AuthenticatedUser> {
    const res = await api.request<ApiResponse<BackendAuthData>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    if (!res.data?.user) {
      throw new Error(res.message || 'Invalid credentials or user not returned.')
    }

    if (res.data.accessToken) {
      writeStoredValue(AUTH_TOKEN_KEY, res.data.accessToken)
    }

    const user = mapUser(res.data.user)
    writeStoredValue(AUTH_USER_KEY, user)
    return user
  },

  async refresh(): Promise<AuthenticatedUser | null> {
    try {
      const res = await api.request<ApiResponse<BackendAuthData>>('/auth/refresh', {
        method: 'POST',
      })
      if (res.data?.user) {
        if (res.data.accessToken) {
          writeStoredValue(AUTH_TOKEN_KEY, res.data.accessToken)
        }
        const user = mapUser(res.data.user)
        writeStoredValue(AUTH_USER_KEY, user)
        return user
      }
      return null
    } catch {
      return null
    }
  },

  async logout(): Promise<void> {
    try {
      await api.request<ApiResponse<void>>('/auth/logout', {
        method: 'POST',
      })
    } finally {
      removeStoredValue(AUTH_USER_KEY)
      removeStoredValue(AUTH_TOKEN_KEY)
    }
  },
}
