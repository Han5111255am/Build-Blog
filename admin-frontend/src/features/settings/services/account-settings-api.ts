import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api'
import type { AccountProfileFormValues, AccountProfileResult, PasswordFormValues } from '@/features/settings/types/account-settings'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function updateAccountProfile(
  payload: AccountProfileFormValues,
): Promise<ApiSuccessResponse<AccountProfileResult>> {
  if (enableMock) {
    const { updateMockAccountProfile } = await import('@/features/settings/services/account-settings-mock')
    return updateMockAccountProfile(payload)
  }

  return resolveMutation<AccountProfileResult>(
    getJson<AccountProfileResult>('/settings/account/', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  )
}

export async function updatePassword(
  payload: PasswordFormValues,
): Promise<ApiSuccessResponse<null>> {
  if (enableMock) {
    const { updateMockPassword } = await import('@/features/settings/services/account-settings-mock')
    return updateMockPassword(payload)
  }

  return resolveMutation<null>(
    getJson<null>('/settings/password/', {
      method: 'POST',
      body: JSON.stringify({
        current_password: payload.current_password,
        new_password: payload.new_password,
        confirm_password: payload.confirm_password,
      }),
    }),
  )
}

async function resolveMutation<T>(
  request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>,
) {
  const response = await request
  if (!response.success) {
    throw response as ApiErrorResponse
  }
  return response
}
