import { createContext, PropsWithChildren, useContext, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/use-translation'

interface QuickCreateContextValue {
  openQuickCreate: () => void
  closeQuickCreate: () => void
}

const createItems = [
  { label: '新建文章', to: '/posts/new' },
  { label: '新建笔记', to: '/notes/new' },
  { label: '新建项目', to: '/projects/new' },
  { label: '新建标签', to: '/tags/new' },
  { label: '新建照片', to: '/photos/new' },
  { label: '新建播客', to: '/podcasts/new' },
]

const QuickCreateContext = createContext<QuickCreateContextValue | null>(null)

export function QuickCreateProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate()
  const { tt } = useTranslation()
  const [open, setOpen] = useState(false)

  const value = useMemo<QuickCreateContextValue>(
    () => ({ openQuickCreate: () => setOpen(true), closeQuickCreate: () => setOpen(false) }),
    [],
  )

  return (
    <QuickCreateContext.Provider value={value}>
      {children}
      {open ? (
        <div className="fixed inset-0 z-[69] flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-panel p-6 shadow-soft backdrop-blur-glass">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">{tt('快速新建')}</p>
              <h2 className="mt-2 text-xl font-semibold text-text">{tt('快速新建')}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{tt('选择要创建的内容类型。')}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {createItems.map((item) => (
                <button
                  key={item.to}
                  className="rounded-xl border border-border bg-white/10 px-4 py-4 text-left text-sm transition hover:bg-white/16 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]"
                  onClick={() => {
                    setOpen(false)
                    void navigate({ to: item.to })
                  }}
                  type="button"
                >
                  <p className="font-medium text-text">{tt(item.label)}</p>
                  <p className="mt-1 text-xs text-muted">{item.to}</p>
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <button className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-text" onClick={() => setOpen(false)} type="button">
                {tt('关闭')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </QuickCreateContext.Provider>
  )
}

export function useQuickCreate() {
  const context = useContext(QuickCreateContext)
  if (!context) {
    throw new Error('useQuickCreate must be used within QuickCreateProvider')
  }
  return context
}
