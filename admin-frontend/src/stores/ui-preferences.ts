import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

export type TableDensity = 'comfortable' | 'compact'

export type MotionLevel = 'full' | 'reduced'

export type AppLanguage = 'zh' | 'en'

export interface UiPreferenceValues {
  theme: ThemeMode
  tableDensity: TableDensity
  motion: MotionLevel
  sidebarCollapsed: boolean
  language: AppLanguage
}

export const defaultUiPreferences: UiPreferenceValues = {
  theme: 'system',
  tableDensity: 'comfortable',
  motion: 'full',
  sidebarCollapsed: false,
  language: 'zh',
}

interface UiPreferencesState {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void

  tableDensity: TableDensity
  setTableDensity: (density: TableDensity) => void

  motion: MotionLevel
  setMotion: (motion: MotionLevel) => void

  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  setPreferences: (preferences: Partial<UiPreferenceValues>) => void
  resetPreferences: () => void
}

export const useUiPreferencesStore = create<UiPreferencesState>()(
  persist(
    (set) => ({
      theme: defaultUiPreferences.theme,
      setTheme: (theme) => set({ theme }),

      tableDensity: defaultUiPreferences.tableDensity,
      setTableDensity: (density) => set({ tableDensity: density }),

      motion: defaultUiPreferences.motion,
      setMotion: (motion) => set({ motion }),

      sidebarCollapsed: defaultUiPreferences.sidebarCollapsed,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      language: defaultUiPreferences.language,
      setLanguage: (language) => set({ language }),
      setPreferences: (preferences) => set((state) => ({ ...state, ...preferences })),
      resetPreferences: () => set(defaultUiPreferences),
    }),
    {
      name: 'admin-frontend-ui-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        tableDensity: state.tableDensity,
        motion: state.motion,
        sidebarCollapsed: state.sidebarCollapsed,
        language: state.language,
      }),
    },
  ),
)
