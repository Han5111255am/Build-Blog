import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api'
import type { PreferenceSettingsPayload, PreferenceSettingsResult } from '@/features/settings/types/preferences'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function fetchPreferenceSettings(): Promise<PreferenceSettingsResult | null> {
  if (enableMock) {
    const { fetchMockPreferenceSettings } = await import('@/features/settings/services/preferences-mock')
    return fetchMockPreferenceSettings()
  }

  const response = await getJson<PreferenceSettingsResult>('/settings/preferences/')
  if (!response.success) {
    return null
  }
  return response.data
}

export async function updatePreferenceSettings(
  payload: PreferenceSettingsPayload,
): Promise<ApiSuccessResponse<PreferenceSettingsResult>> {
  if (enableMock) {
    const { updateMockPreferenceSettings } = await import('@/features/settings/services/preferences-mock')
    return updateMockPreferenceSettings(payload)
  }

  const response = await getJson<PreferenceSettingsResult>('/settings/preferences/', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  if (!response.success) {
    throw response as ApiErrorResponse
  }
  return response
}
