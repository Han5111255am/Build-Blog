import { useTranslation } from '@/features/i18n/use-translation'

interface NoteBulkActionsProps {
  selectedCount: number
  busy?: boolean
  onBatchPublish?: () => void
  onBatchUnpublish?: () => void
  onBatchDelete?: () => void
}

export function NoteBulkActions({
  busy = false,
  onBatchDelete,
  onBatchPublish,
  onBatchUnpublish,
  selectedCount,
}: NoteBulkActionsProps) {
  const { t } = useTranslation()
  const disabled = selectedCount === 0 || busy
  const disabledReason = busy
    ? t(
        '批量操作正在处理中，请等待当前请求完成后再继续。',
        'A bulk action is in progress. Wait for the current request to finish.',
      )
    : selectedCount === 0
      ? t(
          '请先选择至少 1 条笔记，再执行批量操作。',
          'Select at least one note before running a bulk action.',
        )
      : ''

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-soft backdrop-blur-glass md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-medium text-text">
          {t(`已选择 ${selectedCount} 条笔记`, `${selectedCount} notes selected`)}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t(
            '当前已接入批量发布、批量转草稿和批量删除动作。',
            'Batch publish, move to draft, and delete actions are available.',
          )}
        </p>
        {disabledReason ? <p className="mt-1 text-xs text-muted">{disabledReason}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ActionChip
          disabled={disabled}
          label={t('批量发布', 'Batch Publish')}
          onClick={onBatchPublish}
          title={disabledReason}
        />
        <ActionChip
          disabled={disabled}
          label={t('转为草稿', 'Move to Draft')}
          onClick={onBatchUnpublish}
          title={disabledReason}
        />
        <ActionChip
          danger
          disabled={disabled}
          label={t('批量删除', 'Batch Delete')}
          onClick={onBatchDelete}
          title={disabledReason}
        />
      </div>
    </section>
  )
}

function ActionChip({
  danger = false,
  disabled = false,
  label,
  onClick,
  title,
}: {
  danger?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      className={`${danger ? 'admin-button-danger' : 'admin-button-secondary'} admin-button-compact ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? title : undefined}
      type="button"
    >
      {label}
    </button>
  )
}
