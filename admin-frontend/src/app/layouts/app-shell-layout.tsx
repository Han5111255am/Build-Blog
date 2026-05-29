import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/app/providers/toast-provider'
import { Icon } from '@/components/ui/icon'
import { useTranslation } from '@/features/i18n/use-translation'
import { logoutCurrentUser } from '@/features/auth/services/auth-api'
import {
  persistSidebarPreference,
  persistThemePreference,
} from '@/features/settings/services/preferences-session'
import { useAuthStore } from '@/stores/auth-store'
import { ThemeMode, useUiPreferencesStore } from '@/stores/ui-preferences'
import { cn } from '@/utils/cn'

interface NavItem {
  to: string
  label: string
  icon: Parameters<typeof Icon>[0]['name']
  group: 'content' | 'system'
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: '仪表盘', icon: 'dashboard', group: 'content' },
  { to: '/posts', label: '文章', icon: 'posts', group: 'content' },
  { to: '/notes', label: '笔记', icon: 'notes', group: 'content' },
  { to: '/projects', label: '项目', icon: 'projects', group: 'content' },
  { to: '/friend-links', label: '友链', icon: 'friendLinks', group: 'content' },
  { to: '/tags', label: '标签', icon: 'tags', group: 'content' },
  { to: '/assets', label: '素材库', icon: 'assets', group: 'content' },
  { to: '/photos', label: '图库', icon: 'photos', group: 'content' },
  { to: '/podcasts', label: '播客', icon: 'podcasts', group: 'content' },
  { to: '/system/health', label: '系统', icon: 'system', group: 'system' },
  { to: '/settings/account', label: '设置', icon: 'settings', group: 'system' },
]

const themeModes: ThemeMode[] = ['light', 'dark', 'system']

export function AppShellLayout() {
  const navigate = useNavigate()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const { pushToast } = useToast()
  const { language, setLanguage, t, tt } = useTranslation()
  const sidebarCollapsed = useUiPreferencesStore((state) => state.sidebarCollapsed)
  const setSidebarCollapsed = useUiPreferencesStore((state) => state.setSidebarCollapsed)
  const resetPreferences = useUiPreferencesStore((state) => state.resetPreferences)
  const theme = useUiPreferencesStore((state) => state.theme)
  const setTheme = useUiPreferencesStore((state) => state.setTheme)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement | null>(null)

  const groupedItems = useMemo(
    () => ({
      top: navItems,
    }),
    [],
  )

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return
      }

      if (!profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  useEffect(() => {
    setProfileMenuOpen(false)
  }, [pathname, sidebarCollapsed])

  const handleLogout = async () => {
    setProfileMenuOpen(false)
    try {
      await logoutCurrentUser()
    } catch {
      pushToast({
        title: '登录状态已清理',
        description: '后端会话退出失败，已先清空本地登录状态。',
        tone: 'info',
      })
    }

    logout()
    resetPreferences()
    await navigate({ to: '/login' })
  }

  const handleThemeChange = (nextTheme: ThemeMode) => {
    const previousTheme = theme
    setTheme(nextTheme)

    void persistThemePreference(nextTheme).catch(() => {
      setTheme(previousTheme)
      pushToast({
        title: '主题偏好保存失败',
        description: '本地主题已回滚，请稍后重试。',
        tone: 'error',
      })
    })
  }

  const handleSidebarToggle = (nextCollapsed: boolean) => {
    const previousCollapsed = sidebarCollapsed
    setSidebarCollapsed(nextCollapsed)

    void persistSidebarPreference(nextCollapsed).catch(() => {
      setSidebarCollapsed(previousCollapsed)
      pushToast({
        title: '侧边栏偏好保存失败',
        description: '本地侧边栏状态已回滚，请稍后重试。',
        tone: 'error',
      })
    })
  }

  const handleProfileTriggerClick = () => {
    if (sidebarCollapsed) {
      handleSidebarToggle(false)
      setProfileMenuOpen(true)
      return
    }

    setProfileMenuOpen((value) => !value)
  }

  const themeIndex = themeModes.indexOf(theme)
  const languageIndex = language === 'zh' ? 0 : 1
  const sidebarWidth = sidebarCollapsed ? 76 : 232

  return (
    <div className="admin-shell isolate min-h-screen bg-background text-text">
      <div className="relative z-10 mx-auto flex h-screen max-h-screen w-full max-w-[1760px] gap-4 px-3 py-3 sm:px-5 sm:py-4 lg:gap-5 lg:px-6">
        <aside
          className="sidebar-shell group/sidebar relative z-[120] flex h-[calc(100vh-1.5rem)] shrink-0 flex-col overflow-visible rounded-[24px] border border-border bg-surface p-3 shadow-soft sm:h-[calc(100vh-2rem)]"
          style={{
            '--sidebar-width': `${sidebarWidth}px`,
          } as CSSProperties}
        >
          <button
            aria-label={tt(sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏')}
            className="absolute -right-3 top-8 z-[160] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted shadow-soft transition duration-200 hover:-translate-y-0.5 hover:border-text/10 hover:bg-background hover:text-text"
            onClick={() => handleSidebarToggle(!sidebarCollapsed)}
            title={tt(sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏')}
            type="button"
          >
            <Icon className="h-3.5 w-3.5" name={sidebarCollapsed ? 'chevronRight' : 'chevronLeft'} />
          </button>

          <div
            className={cn(
              'flex min-h-[62px] items-center px-2 pb-5 pt-2 transition-[gap] duration-[320ms] ease-[cubic-bezier(0.25,1,0.5,1)]',
              sidebarCollapsed ? 'justify-center gap-0' : 'gap-3',
            )}
          >
            <div className="flex h-14 w-16 shrink-0 items-center justify-center overflow-visible bg-transparent">
              <img
                alt="Blog logo"
                className="h-[58px] w-[76px] max-w-none object-contain object-center dark:hidden"
                src="/site-logo.svg"
              />
              <img
                alt="Blog logo"
                className="hidden h-[58px] w-[76px] max-w-none object-contain object-center dark:block"
                src="/site-logo-dark.svg"
              />
            </div>
            <div
              className={cn(
                'sidebar-brand-text min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                sidebarCollapsed ? 'max-w-0 translate-x-1 opacity-0' : 'max-w-[150px] translate-x-0 opacity-100',
              )}
            >
              <h2 className="truncate text-[14px] font-semibold leading-5 text-text">Blog OS</h2>
              <p className="truncate text-[11px] font-medium leading-4 text-muted">{t('博客后台管理系统', 'Blog Admin System')}</p>
            </div>
          </div>

          <div
            className={cn(
              'sidebar-scroll-area min-h-0 flex-1 overflow-y-auto overflow-x-visible px-1 pb-4',
              profileMenuOpen ? 'pointer-events-none' : 'pointer-events-auto',
            )}
          >
            <SidebarSection collapsed={sidebarCollapsed} items={groupedItems.top} pathname={pathname} tt={tt} />
          </div>

          <div className="px-1 pb-4 pt-1">
            <div className={cn('relative isolate', profileMenuOpen ? 'z-[820]' : 'z-[130]')} ref={profileMenuRef}>
              <div
                className={cn(
                  'flex w-full items-center rounded-[18px] border border-transparent bg-background/70 transition hover:border-border hover:bg-surface hover:text-text',
                  sidebarCollapsed
                    ? 'justify-center border-transparent bg-transparent px-0 py-1.5 hover:border-transparent hover:bg-transparent'
                    : 'gap-2 px-2 py-2',
                )}
              >
                <button
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  aria-label={tt('主题与账号')}
                  className={cn(
                    'flex min-w-0 flex-1 items-center rounded-[14px] text-left transition hover:text-text',
                    sidebarCollapsed ? 'justify-center' : 'gap-3',
                  )}
                  onClick={handleProfileTriggerClick}
                  type="button"
                >
                  <div className={cn('h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border shadow-soft', sidebarCollapsed && 'shadow-none')}>
                    <img
                      alt={user?.displayName ?? user?.username ?? 'Admin'}
                      className="h-full w-full object-cover"
                      src="/site-avatar.svg"
                    />
                  </div>
                  {!sidebarCollapsed ? (
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold text-text">{user?.displayName ?? 'Admin'}</p>
                      <p className="truncate text-[11px] text-muted">
                        {user?.roles?.includes('admin') ? t('系统总管理员', 'System Administrator') : user?.username ?? 'admin'}
                      </p>
                    </div>
                  ) : null}
                </button>

                {!sidebarCollapsed ? (
                  <button
                    aria-label={tt('退出登录')}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-background hover:text-brand"
                    onClick={handleLogout}
                    title={tt('退出登录')}
                    type="button"
                  >
                    <Icon className="h-4 w-4" name="logout" />
                  </button>
                ) : null}
              </div>

              <div
                className={cn(
                  'absolute inset-x-0 z-[700] rounded-[18px] border border-border bg-surface p-2 shadow-glass transition duration-200',
                  sidebarCollapsed ? 'bottom-0 left-[calc(100%+10px)] right-auto w-[156px]' : '',
                  profileMenuOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0',
                )}
                role="menu"
                style={sidebarCollapsed ? { bottom: '0' } : { bottom: 'calc(100% + 18px)' }}
              >
                  <div className="rounded-[14px] border border-border bg-background/70 px-2.5 py-2">
                  <div className="flex items-center justify-center">
                    <div className="relative h-7 w-[112px] rounded-[12px] bg-white/10 p-1 dark:bg-white/[0.04]">
                      <span
                        className="absolute top-1 h-5 w-[32px] rounded-[8px] bg-text shadow-soft transition-all duration-200"
                        style={{ left: `${4 + themeIndex * 34}px` }}
                      />
                      <div className="relative z-10 flex h-full items-center justify-between gap-1">
                        <button
                          aria-label={tt('切换浅色主题')}
                          className={cn(
                            'flex h-5 w-8 items-center justify-center rounded-[8px] text-[11px] transition duration-200',
                            theme === 'light' ? 'text-background' : 'text-text/80 hover:text-text',
                          )}
                          onClick={() => handleThemeChange('light')}
                          type="button"
                        >
                          <Icon className="h-4 w-4" name="sun" />
                        </button>
                        <button
                          aria-label={tt('切换深色主题')}
                          className={cn(
                            'flex h-5 w-8 items-center justify-center rounded-[8px] text-[11px] transition duration-200',
                            theme === 'dark' ? 'text-background' : 'text-text/80 hover:text-text',
                          )}
                          onClick={() => handleThemeChange('dark')}
                          type="button"
                        >
                          <Icon className="h-4 w-4" name="moon" />
                        </button>
                        <button
                          aria-label={tt('切换系统主题')}
                          className={cn(
                            'flex h-5 w-8 items-center justify-center rounded-[8px] text-[11px] transition duration-200',
                            theme === 'system' ? 'text-background' : 'text-text/80 hover:text-text',
                          )}
                          onClick={() => handleThemeChange('system')}
                          type="button"
                        >
                          <Icon className="h-4 w-4" name="systemTheme" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 rounded-[14px] border border-border bg-background/70 px-2.5 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-text">{t('语言', 'Language')}</span>
                    <div className="relative h-7 w-[88px] rounded-[12px] bg-white/10 p-1 dark:bg-white/[0.04]">
                      <span
                        className="absolute top-1 h-5 w-[38px] rounded-[8px] bg-text shadow-soft transition-all duration-200"
                        style={{ left: `${4 + languageIndex * 40}px` }}
                      />
                      <div className="relative z-10 flex h-full items-center justify-between gap-1">
                        <button
                          aria-label={tt('切换到中文')}
                          className={cn(
                            'flex h-5 w-9 items-center justify-center rounded-[8px] text-[11px] font-semibold transition duration-200',
                            language === 'zh' ? 'text-background' : 'text-text/80 hover:text-text',
                          )}
                          onClick={() => setLanguage('zh')}
                          type="button"
                        >
                          中
                        </button>
                        <button
                          aria-label={tt('切换到英文')}
                          className={cn(
                            'flex h-5 w-9 items-center justify-center rounded-[8px] text-[11px] font-semibold transition duration-200',
                            language === 'en' ? 'text-background' : 'text-text/80 hover:text-text',
                          )}
                          onClick={() => setLanguage('en')}
                          type="button"
                        >
                          EN
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </aside>

        <div className="flex h-[calc(100vh-1.5rem)] min-w-0 flex-1 flex-col overflow-hidden sm:h-[calc(100vh-2rem)]">
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 lg:p-6">
            <PageContainer>
              <Outlet />
            </PageContainer>
          </main>
        </div>
      </div>
    </div>
  )
}

function SidebarSection({
  collapsed,
  items,
  pathname,
  tt,
}: {
  collapsed: boolean
  items: NavItem[]
  pathname: string
  tt: (text: string) => string
}) {
  return (
    <section className="mb-0 last:mb-0">
      <nav className="space-y-1 overflow-visible">
        {items.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`)

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'sidebar-nav-item relative z-10 flex items-center overflow-visible border border-transparent bg-transparent transition duration-200',
                'min-h-[44px] rounded-[14px] px-2.5 py-2',
                collapsed ? 'justify-center gap-0' : 'gap-3',
                isActive ? 'text-text' : 'text-muted hover:text-text',
                isActive
                  ? 'border-border bg-background text-text shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
                  : 'hover:border-border hover:bg-background/70',
              )}
              title={collapsed ? tt(item.label) : undefined}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-transparent">
                <Icon className="h-[21px] w-[21px]" name={item.icon} />
              </span>
              <span
                className={cn(
                  'sidebar-nav-label min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                  collapsed ? 'max-w-0 translate-x-1 opacity-0' : 'max-w-[132px] translate-x-0 opacity-100',
                )}
              >
                <span className="block truncate text-[14px] font-semibold">{tt(item.label)}</span>
              </span>
              {collapsed ? <span className="sidebar-tooltip">{tt(item.label)}</span> : null}
            </Link>
          )
        })}
      </nav>
    </section>
  )
}

function PageContainer({ children }: PropsWithChildren) {
  return <div className="flex min-h-0 w-full flex-col gap-6">{children}</div>
}
