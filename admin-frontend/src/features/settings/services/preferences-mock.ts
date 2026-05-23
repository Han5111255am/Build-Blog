import type { ApiSuccessResponse } from '@/types/api'
import type { PreferenceSettingsPayload, PreferenceSettingsResult } from '@/features/settings/types/preferences'

let mockPreferenceSettings: PreferenceSettingsResult = {
  theme: 'system',
  table_density: 'comfortable',
  motion: 'full',
  sidebar_collapsed: false,
}

export async function fetchMockPreferenceSettings(): Promise<PreferenceSettingsResult> {
  await delay(80)
  return mockPreferenceSettings
}

export async function updateMockPreferenceSettings(
  payload: PreferenceSettingsPayload,
): Promise<ApiSuccessResponse<PreferenceSettingsResult>> {
  await delay(80)
  mockPreferenceSettings = { ...mockPreferenceSettings, ...payload }
  return {
    success: true,
    message: 'Preferences updated successfully.',
    data: mockPreferenceSettings,
  }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
