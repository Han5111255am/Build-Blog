import { fetchPreferenceSettings, updatePreferenceSettings } from '@/features/settings/services/preferences-api'
import { mapPreferenceResultToStoreValues } from '@/features/settings/types/preferences'
import type { MotionLevel, TableDensity, ThemeMode } from '@/stores/ui-preferences'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

let hydratePreferencesPromise: Promise<void> | null = null

export async function hydratePreferenceSettings(): Promise<void> {
  if (!hydratePreferencesPromise) {
    hydratePreferencesPromise = loadPreferenceSettings().finally(() => {
      hydratePreferencesPromise = null
    })
  }

  await hydratePreferencesPromise
}

export async function persistThemePreference(theme: ThemeMode) {
  return persistPreferencePatch({ theme })
}

export async function persistTableDensityPreference(tableDensity: TableDensity) {
  return persistPreferencePatch({ table_density: tableDensity })
}

export async function persistMotionPreference(motion: MotionLevel) {
  return persistPreferencePatch({ motion })
}

export async function persistSidebarPreference(sidebarCollapsed: boolean) {
  return persistPreferencePatch({ sidebar_collapsed: sidebarCollapsed })
}

export async function persistPreferenceSettings(payload: Parameters<typeof updatePreferenceSettings>[0]) {
  return persistPreferencePatch(payload)
}

async function loadPreferenceSettings(): Promise<void> {
  const result = await fetchPreferenceSettings()
  if (!result) {
    return
  }

  useUiPreferencesStore.getState().setPreferences(mapPreferenceResultToStoreValues(result))
}

async function persistPreferencePatch(
  payload: Parameters<typeof updatePreferenceSettings>[0],
): Promise<void> {
  const response = await updatePreferenceSettings(payload)
  useUiPreferencesStore.getState().setPreferences(mapPreferenceResultToStoreValues(response.data))
}
