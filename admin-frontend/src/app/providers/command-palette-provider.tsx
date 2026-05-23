import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/use-translation'

interface CommandPaletteContextValue {
  openPalette: () => void
  closePalette: () => void
}

const quickLinks = [
  { label: '前往文章', to: '/posts' },
  { label: '前往笔记', to: '/notes' },
  { label: '前往项目', to: '/projects' },
  { label: '前往标签', to: '/tags' },
  { label: '前往素材库', to: '/assets' },
  { label: '前往图库', to: '/photos' },
  { label: '前往播客', to: '/podcasts' },
  { label: '前往系统状态', to: '/system/health' },
  { label: '前往偏好设置', to: '/settings/preferences' },
]

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function CommandPaletteProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const { tt } = useTranslation()
  const [open, setOpen] = useState(false)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const filteredLinks = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    if (!normalized) return quickLinks
    return quickLinks.filter((item) => item.label.toLowerCase().includes(normalized) || item.to.toLowerCase().includes(normalized))
  }, [keyword])

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ openPalette: () => setOpen(true), closePalette: () => setOpen(false) }),
    [],
  )

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-[rgba(15,23,42,0.45)] px-4 pt-[12vh]">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-panel p-4 shadow-soft backdrop-blur-glass">
            <div className="mb-3">
              <input
                autoFocus
                className="h-12 w-full rounded-xl border border-border bg-white/12 px-4 text-sm text-text outline-none transition focus:border-brand/40 focus:ring-2 focus:ring-brand/15 dark:bg-white/[0.03]"
                onChange={(event) => setKeyword(event.target.value)}
                placeholder={tt('搜索页面或功能...（Ctrl/Cmd + K）')}
                value={keyword}
              />
            </div>
            <div className="space-y-2">
              {filteredLinks.map((item) => (
                <button
                  key={item.to}
                  className="flex w-full items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left text-sm transition hover:border-border hover:bg-white/12 dark:hover:bg-white/[0.04]"
                  onClick={() => {
                    setOpen(false)
                    setKeyword('')
                    void navigate({ to: item.to })
                  }}
                  type="button"
                >
                  <span className="font-medium text-text">{tt(item.label)}</span>
                  <span className="text-xs text-muted">{item.to}</span>
                </button>
              ))}
              {filteredLinks.length === 0 ? <p className="px-2 py-6 text-center text-sm text-muted">{tt('没有匹配结果。')}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (!context) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  }
  return context
}
