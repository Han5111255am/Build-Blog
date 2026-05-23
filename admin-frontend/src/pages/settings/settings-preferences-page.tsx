import { useEffect, useState } from 'react'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { useTranslation } from '@/features/i18n/use-translation'
import {
  hydratePreferenceSettings,
  persistMotionPreference,
  persistSidebarPreference,
  persistTableDensityPreference,
  persistThemePreference,
} from '@/features/settings/services/preferences-session'
import {
  type MotionLevel,
  type TableDensity,
  type ThemeMode,
  useUiPreferencesStore,
} from '@/stores/ui-preferences'

type SavingField = 'theme' | 'tableDensity' | 'motion' | 'sidebar' | null

export function SettingsPreferencesPage() {
  const { pushToast } = useToast()
  const { language, setLanguage, t } = useTranslation()
  const theme = useUiPreferencesStore((state) => state.theme)
  const setTheme = useUiPreferencesStore((state) => state.setTheme)
  const tableDensity = useUiPreferencesStore((state) => state.tableDensity)
  const setTableDensity = useUiPreferencesStore((state) => state.setTableDensity)
  const motion = useUiPreferencesStore((state) => state.motion)
  const setMotion = useUiPreferencesStore((state) => state.setMotion)
  const sidebarCollapsed = useUiPreferencesStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useUiPreferencesStore((state) => state.setSidebarCollapsed)
  const [savingField, setSavingField] = useState<SavingField>(null)

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: 'light', label: t('浅色', 'Light') },
    { value: 'dark', label: t('深色', 'Dark') },
    { value: 'system', label: t('跟随系统', 'System') },
  ]

  const tableDensityOptions: Array<{ value: TableDensity; label: string }> = [
    { value: 'comfortable', label: t('舒适', 'Comfortable') },
    { value: 'compact', label: t('紧凑', 'Compact') },
  ]

  const motionOptions: Array<{ value: MotionLevel; label: string }> = [
    { value: 'full', label: t('完整', 'Full') },
    { value: 'reduced', label: t('减少', 'Reduced') },
  ]

  useEffect(() => {
    let active = true

    void hydratePreferenceSettings().catch(() => {
      if (!active) {
        return
      }

      pushToast({
        title: t('偏好设置加载失败', 'Failed to Load Preferences'),
        description: t(
          '已保留本地偏好状态，请稍后重试。',
          'Local preferences were kept. Please try again later.',
        ),
        tone: 'error',
      })
    })

    return () => {
      active = false
    }
  }, [pushToast, t])

  const handleThemeChange = async (nextTheme: ThemeMode) => {
    const previousTheme = theme
    if (previousTheme === nextTheme) {
      return
    }

    setTheme(nextTheme)
    setSavingField('theme')
    try {
      await persistThemePreference(nextTheme)
      pushToast({
        title: t('主题偏好已保存', 'Theme Preference Saved'),
        description: t('设置已同步到当前账号。', 'The setting has been synced to the current account.'),
        tone: 'success',
      })
    } catch {
      setTheme(previousTheme)
      pushToast({
        title: t('主题偏好保存失败', 'Failed to Save Theme Preference'),
        description: t('本地设置已回滚，请稍后重试。', 'The local setting was rolled back. Please try again later.'),
        tone: 'error',
      })
    } finally {
      setSavingField(null)
    }
  }

  const handleTableDensityChange = async (nextDensity: TableDensity) => {
    const previousDensity = tableDensity
    if (previousDensity === nextDensity) {
      return
    }

    setTableDensity(nextDensity)
    setSavingField('tableDensity')
    try {
      await persistTableDensityPreference(nextDensity)
      pushToast({
        title: t('列表密度已保存', 'Table Density Saved'),
        description: t('设置已同步到当前账号。', 'The setting has been synced to the current account.'),
        tone: 'success',
      })
    } catch {
      setTableDensity(previousDensity)
      pushToast({
        title: t('列表密度保存失败', 'Failed to Save Table Density'),
        description: t('本地设置已回滚，请稍后重试。', 'The local setting was rolled back. Please try again later.'),
        tone: 'error',
      })
    } finally {
      setSavingField(null)
    }
  }

  const handleMotionChange = async (nextMotion: MotionLevel) => {
    const previousMotion = motion
    if (previousMotion === nextMotion) {
      return
    }

    setMotion(nextMotion)
    setSavingField('motion')
    try {
      await persistMotionPreference(nextMotion)
      pushToast({
        title: t('动效偏好已保存', 'Motion Preference Saved'),
        description: t('设置已同步到当前账号。', 'The setting has been synced to the current account.'),
        tone: 'success',
      })
    } catch {
      setMotion(previousMotion)
      pushToast({
        title: t('动效偏好保存失败', 'Failed to Save Motion Preference'),
        description: t('本地设置已回滚，请稍后重试。', 'The local setting was rolled back. Please try again later.'),
        tone: 'error',
      })
    } finally {
      setSavingField(null)
    }
  }

  const handleSidebarToggle = async () => {
    const nextCollapsed = !sidebarCollapsed
    setSidebarCollapsed(nextCollapsed)
    setSavingField('sidebar')
    try {
      await persistSidebarPreference(nextCollapsed)
      pushToast({
        title: t('侧边栏偏好已保存', 'Sidebar Preference Saved'),
        description: t('设置已同步到当前账号。', 'The setting has been synced to the current account.'),
        tone: 'success',
      })
    } catch {
      setSidebarCollapsed(!nextCollapsed)
      pushToast({
        title: t('侧边栏偏好保存失败', 'Failed to Save Sidebar Preference'),
        description: t('本地设置已回滚，请稍后重试。', 'The local setting was rolled back. Please try again later.'),
        tone: 'error',
      })
    } finally {
      setSavingField(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={t(
          '管理主题、列表密度、动效和侧边栏默认状态。',
          'Manage theme, table density, motion, and the default sidebar state.',
        )}
        eyebrow={t('设置', 'Settings')}
        meta={t('所有改动都会同步到当前账号。', 'Changes will sync to the current account.')}
        title={t('偏好设置', 'Preferences')}
      />

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <h2 className="text-base font-semibold text-text">
            {t('界面偏好', 'Interface Preferences')}
          </h2>
          <div className="mt-4 space-y-4 text-sm text-muted">
            <div className="flex flex-col gap-2">
              <p className="font-medium text-text">
                {t('默认界面语言', 'Default Interface Language')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  className="admin-option-button"
                  data-selected={language === 'zh'}
                  onClick={() => setLanguage('zh')}
                  type="button"
                >
                  {t('中文', 'Chinese')}
                </button>
                <button
                  className="admin-option-button"
                  data-selected={language === 'en'}
                  onClick={() => setLanguage('en')}
                  type="button"
                >
                  {t('英文', 'English')}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-text">{t('主题模式', 'Theme Mode')}</p>
              <div className="flex flex-wrap gap-2">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    className="admin-option-button"
                    data-selected={theme === option.value}
                    disabled={savingField === 'theme'}
                    onClick={() => void handleThemeChange(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="font-medium text-text">{t('列表密度', 'Table Density')}</p>
              <div className="flex flex-wrap gap-2">
                {tableDensityOptions.map((option) => (
                  <button
                    key={option.value}
                    className="admin-option-button"
                    data-selected={tableDensity === option.value}
                    disabled={savingField === 'tableDensity'}
                    onClick={() => void handleTableDensityChange(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-text">
                  {t('默认折叠侧边栏', 'Collapse Sidebar by Default')}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {t(
                    '控制再次进入后台时侧边栏的初始状态。',
                    'Control the initial sidebar state when you enter the admin again.',
                  )}
                </p>
              </div>
              <button
                className="admin-option-button"
                data-selected={sidebarCollapsed}
                disabled={savingField === 'sidebar'}
                onClick={() => void handleSidebarToggle()}
                type="button"
              >
                {sidebarCollapsed ? t('已折叠', 'Collapsed') : t('已展开', 'Expanded')}
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <h2 className="text-base font-semibold text-text">
            {t('编辑体验', 'Editing Experience')}
          </h2>
          <div className="mt-4 space-y-4 text-sm text-muted">
            <div className="flex flex-col gap-2">
              <p className="font-medium text-text">{t('动效强度', 'Motion Level')}</p>
              <div className="flex flex-wrap gap-2">
                {motionOptions.map((option) => (
                  <button
                    key={option.value}
                    className="admin-option-button"
                    data-selected={motion === option.value}
                    disabled={savingField === 'motion'}
                    onClick={() => void handleMotionChange(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted">
              {t(
                '减少动效可以降低动画频率，适合低性能设备或更专注的编辑环境。',
                'Reduced motion lowers animation frequency and suits low-performance devices or more focused editing sessions.',
              )}
            </p>
          </div>
        </article>
      </section>
    </div>
  )
}
