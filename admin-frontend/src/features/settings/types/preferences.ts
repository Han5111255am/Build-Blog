import type { MotionLevel, TableDensity, ThemeMode, UiPreferenceValues } from '@/stores/ui-preferences'

export interface PreferenceSettingsResult {
  theme: ThemeMode
  table_density: TableDensity
  motion: MotionLevel
  sidebar_collapsed: boolean
}

export interface PreferenceSettingsPayload {
  theme?: ThemeMode
  table_density?: TableDensity
  motion?: MotionLevel
  sidebar_collapsed?: boolean
}

export function mapPreferenceResultToStoreValues(result: PreferenceSettingsResult): Partial<UiPreferenceValues> {
  return {
    theme: result.theme,
    tableDensity: result.table_density,
    motion: result.motion,
    sidebarCollapsed: result.sidebar_collapsed,
  }
}
