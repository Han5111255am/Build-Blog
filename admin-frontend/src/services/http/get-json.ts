import { apiRequest } from '@/services/http/api-client'
import { handleUnauthorizedSession } from '@/features/auth/services/auth-redirect'
import type { ApiResponse } from '@/types/api'

export async function getJson<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await apiRequest(path, init)
  const payload = (await response.json()) as ApiResponse<T>

  if (shouldResetUnauthorizedSession(path, response.status, payload)) {
    handleUnauthorizedSession()
  }

  return payload
}

function shouldResetUnauthorizedSession<T>(
  path: string,
  statusCode: number,
  payload: ApiResponse<T>,
) {
  if (!isProtectedAdminRequest(path)) {
    return false
  }

  if (!(statusCode === 401 || statusCode === 403)) {
    return false
  }

  return !payload.success && payload.error_code === 'permission_denied'
}

function isProtectedAdminRequest(path: string) {
  return !path.startsWith('/auth/')
}

