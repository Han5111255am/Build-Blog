import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api'
import type { AuthUser } from '@/stores/auth-store'

interface AuthApiUser {
  id: number
  username: string
  display_name: string
  roles: string[]
}

interface LoginPayload {
  username: string
  password: string
}

export async function initializeAuthCsrf(): Promise<void> {
  const response = await getJson<null>('/auth/csrf/')
  if (!response.success) {
    throw response
  }
}

export async function loginWithPassword(
  payload: LoginPayload,
): Promise<ApiSuccessResponse<AuthUser>> {
  return resolveAuthMutation(
    getJson<AuthApiUser>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  )
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await getJson<AuthApiUser>('/auth/me/')
  if (!response.success) {
    return null
  }
  return mapApiUser(response.data)
}

export async function logoutCurrentUser(): Promise<void> {
  const response = await getJson<null>('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  if (!response.success) {
    throw response
  }
}

async function resolveAuthMutation(
  request: Promise<ApiSuccessResponse<AuthApiUser> | ApiErrorResponse>,
): Promise<ApiSuccessResponse<AuthUser>> {
  const response = await request
  if (!response.success) {
    throw response as ApiErrorResponse
  }

  return {
    ...response,
    data: mapApiUser(response.data),
  }
}

function mapApiUser(user: AuthApiUser): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    roles: user.roles,
  }
}
