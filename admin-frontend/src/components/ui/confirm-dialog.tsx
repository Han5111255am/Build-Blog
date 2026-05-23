import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/features/i18n/use-translation'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

export function ConfirmDialog({
  cancelLabel = '取消',
  children,
  confirmLabel = '确认',
  danger = false,
  description,
  loading = false,
  onCancel,
  onConfirm,
  open,
  title,
}: ConfirmDialogProps) {
  const { tt } = useTranslation()

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(15,23,42,0.22)] px-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-[22px] border border-border bg-surface p-6 shadow-glass">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-text">{tt(title)}</h2>
          <p className="text-sm leading-6 text-muted">{tt(description)}</p>
          {children}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button className="admin-button-secondary px-4 py-2.5 text-sm font-semibold" onClick={onCancel} type="button">
            {tt(cancelLabel)}
          </button>
          <Button loading={loading} onClick={onConfirm} type="button" variant={danger ? 'danger' : 'primary'}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
