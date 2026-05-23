import type { ApiSuccessResponse } from '@/types/api'
import type { AccountProfileFormValues, AccountProfileResult, PasswordFormValues } from '@/features/settings/types/account-settings'

export async function updateMockAccountProfile(
  payload: AccountProfileFormValues,
): Promise<ApiSuccessResponse<AccountProfileResult>> {
  await delay(220)

  return {
    success: true,
    message: '账号资料已更新',
    data: {
      username: payload.username,
      display_name: payload.display_name,
    },
  }
}

export async function updateMockPassword(
  _payload: PasswordFormValues,
): Promise<ApiSuccessResponse<null>> {
  await delay(260)

  return {
    success: true,
    message: '密码已更新，请妥善保管新密码',
    data: null,
  }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
