import { useUiPreferencesStore } from '@/stores/ui-preferences'
import { useTranslation } from '@/features/i18n/use-translation'
import { cn } from '@/utils/cn'

export function ThemeToggle() {
  const theme = useUiPreferencesStore((state) => state.theme)
  const setTheme = useUiPreferencesStore((state) => state.setTheme)
  const { t } = useTranslation()

  return (
    <div className="flex items-center rounded-[12px] border border-border bg-white/10 p-1 dark:bg-white/[0.03]">
      {(['light', 'dark', 'system'] as const).map((option) => (
        <button
          key={option}
          className={cn(
            'min-h-8 rounded-[9px] px-3 py-1.5 text-xs font-semibold transition',
            theme === option ? 'admin-button-primary admin-button-sm' : 'text-muted hover:bg-background hover:text-text',
          )}
          onClick={() => setTheme(option)}
          type="button"
        >
          {option === 'light' ? t('浅色', 'Light') : option === 'dark' ? t('深色', 'Dark') : t('跟随系统', 'System')}
        </button>
      ))}
    </div>
  )
}
