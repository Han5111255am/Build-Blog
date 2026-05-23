import { PropsWithChildren, useEffect } from 'react'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useUiPreferencesStore((state) => state.theme)
  const tableDensity = useUiPreferencesStore((state) => state.tableDensity)
  const motion = useUiPreferencesStore((state) => state.motion)
  const sidebarCollapsed = useUiPreferencesStore((state) => state.sidebarCollapsed)

  useEffect(() => {
    const root = document.documentElement
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

    root.classList.remove('light', 'dark')
    root.classList.add(resolvedTheme)
    root.dataset.theme = resolvedTheme

    root.dataset.density = tableDensity
    root.dataset.motion = motion
    root.dataset.sidebar = sidebarCollapsed ? 'collapsed' : 'expanded'
  }, [motion, sidebarCollapsed, tableDensity, theme])

  return children
}

