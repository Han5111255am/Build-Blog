import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

export function LanguageProvider({ children }: PropsWithChildren) {
  const language = useUiPreferencesStore((state) => state.language)

  useEffect(() => {
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN'
  }, [language])

  return <>{children}</>
}
