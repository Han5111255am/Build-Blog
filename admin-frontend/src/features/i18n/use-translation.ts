import { pickText, translateText } from '@/features/i18n/translation'
import { useUiPreferencesStore } from '@/stores/ui-preferences'

export function useTranslation() {
  const language = useUiPreferencesStore((state) => state.language)
  const setLanguage = useUiPreferencesStore((state) => state.setLanguage)
  const translateOptional = (text?: string | null) => (text ? translateText(text, language) : '')

  return {
    language,
    setLanguage,
    isEnglish: language === 'en',
    t: (zh: string, en: string) => pickText(language, zh, en),
    tt: (text: string) => translateText(text, language),
    translateOptional,
  }
}
