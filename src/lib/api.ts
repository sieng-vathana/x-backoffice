export class ApiError extends Error {
  public readonly status?: number
  public readonly details?: unknown
  constructor(message: string, status?: number, details?: unknown) {
    super(message)
    this.status = status
    this.details = details
    this.name = 'ApiError'
  }
}

export interface ApiClientOptions {
  baseUrl?: string
  getToken?: () => string | null | undefined
}

const API_GATEWAY_URL = (
  import.meta.env.DEV
    ? import.meta.env.VITE_API_GATEWAY_URL?.trim() || 'https://api.learner-teach.online'
    : ''
).replace(/\/$/, '')

export const API_BASE_URL = `${API_GATEWAY_URL}/api/v1`

export function resolveImageUrl(url?: string | null): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  if (url.startsWith('/')) {
    return `${API_GATEWAY_URL}${url}`
  }
  return `${API_GATEWAY_URL}/${url}`
}

let refreshPromise: Promise<boolean> | null = null

export class ApiClient {
  private readonly options: ApiClientOptions

  constructor(options: ApiClientOptions = {}) {
    this.options = options
  }

  private async refreshSession(): Promise<boolean> {
    if (!refreshPromise) {
      const baseUrl = this.options.baseUrl ?? API_BASE_URL
      refreshPromise = fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'X-Client-Type': 'web',
        },
      })
        .then((res) => res.ok)
        .catch(() => false)
        .finally(() => {
          refreshPromise = null
        })
    }
    return refreshPromise
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = this.options.getToken ? this.options.getToken() : null
    const baseUrl = this.options.baseUrl ?? API_BASE_URL
    const url = path.startsWith('http') ? path : `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`
    const isAuthRequest = path.includes('/auth/login') || path.includes('/auth/refresh') || path.includes('/auth/register')

    const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData

    const response = await fetch(url, {
      ...init,
      credentials: init.credentials ?? 'include',
      headers: {
        Accept: 'application/json',
        ...(init.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Client-Type': 'web',
        ...init.headers,
      },
    })

    if (response.status === 401 && !isAuthRequest) {
      const refreshed = await this.refreshSession()
      if (refreshed) {
        return this.request<T>(path, init)
      } else {
        window.dispatchEvent(new CustomEvent('backoffice:session-expired'))
        throw new ApiError('Your session has expired. Please sign in again.', 401)
      }
    }

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string; error?: string } | null
      const detail = payload?.message || payload?.error || (await response.text().catch(() => ''))
      throw new ApiError(detail || `Request failed with status ${response.status}`, response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  }
}

export const api = new ApiClient({ baseUrl: API_BASE_URL })
