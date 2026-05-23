import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from 'react'
import { useTranslation } from '@/features/i18n/use-translation'

interface ToastItem {
  id: number
  title: string
  description?: string
  tone?: 'success' | 'error' | 'info'
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: PropsWithChildren) {
  const { tt } = useTranslation()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const pushToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.floor(Math.random() * 1000)
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => removeToast(id), 3200)
  }, [removeToast])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto rounded-xl border bg-panel p-4 shadow-soft backdrop-blur-glass ${resolveToastToneClass(toast.tone)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-text">{tt(toast.title)}</p>
                {toast.description ? <p className="mt-1 text-sm text-muted">{tt(toast.description)}</p> : null}
              </div>
              <button className="text-xs text-muted transition hover:text-text" onClick={() => removeToast(toast.id)} type="button">
                {tt('关闭')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function resolveToastToneClass(tone: ToastItem['tone']) {
  if (tone === 'success') return 'border-[rgba(47,158,111,0.28)]'
  if (tone === 'error') return 'border-[rgba(240,118,118,0.32)]'
  return 'border-border'
}
