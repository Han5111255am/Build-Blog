import { useTranslation } from '@/features/i18n/use-translation'
import type { TagUsageItem } from '@/features/tags/types/tag'

interface TagUsageSectionProps {
  noteCount: number
  postCount: number
  projectCount: number
  usageText: string
  usageItems: TagUsageItem[]
  unlinkingKey?: string | null
  onOpenReference?: (item: TagUsageItem) => void
  onRequestUnlink?: (item: TagUsageItem) => void
}

export function TagUsageSection({
  noteCount,
  postCount,
  projectCount,
  usageItems,
  usageText,
  unlinkingKey,
  onOpenReference,
  onRequestUnlink,
}: TagUsageSectionProps) {
  const { language, t, tt } = useTranslation()

  return (
    <div className="space-y-4 text-sm text-muted">
      <p className="font-medium text-text">{tt(usageText)}</p>
      <dl className="space-y-2">
        <UsageRow label={tt('文章引用')} value={language === 'en' ? `${postCount} items` : `${postCount} 条`} />
        <UsageRow label={tt('笔记引用')} value={language === 'en' ? `${noteCount} items` : `${noteCount} 条`} />
        <UsageRow label={tt('项目引用')} value={language === 'en' ? `${projectCount} items` : `${projectCount} 条`} />
      </dl>

      {usageItems.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
            {t('引用明细', 'Reference Details')}
          </p>
          <div className="space-y-3">
            {usageItems.map((item) => {
              const itemKey = buildUsageKey(item)
              return (
                <div key={itemKey} className="rounded-2xl border border-border bg-background/70 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium text-text">{item.title}</p>
                      <p className="text-xs text-muted">
                        {formatUsageType(item.content_type, t)} · {item.slug}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgba(0,113,227,0.1)] px-2.5 py-1 text-xs font-medium text-brand">
                      {item.status || 'draft'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {t('最近更新', 'Updated')} {item.updated_at}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="admin-button-secondary admin-button-sm"
                      onClick={() => onOpenReference?.(item)}
                      type="button"
                    >
                      {t('打开内容', 'Open')}
                    </button>
                    <button
                      className="admin-button-danger admin-button-sm disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={unlinkingKey === itemKey}
                      onClick={() => onRequestUnlink?.(item)}
                      type="button"
                    >
                      {unlinkingKey === itemKey ? t('正在解绑', 'Unlinking') : t('解绑引用', 'Unlink')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs leading-6 text-muted">
          {t(
            '当前标签还没有内容引用，可以直接删除或继续用于新内容。',
            'This tag is not referenced yet. It can be deleted directly or reused in new content.',
          )}
        </p>
      )}
    </div>
  )
}

function UsageRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt>{label}</dt>
      <dd className="font-medium text-text">{value}</dd>
    </div>
  )
}

function buildUsageKey(item: TagUsageItem) {
  return `${item.content_type}:${item.item_id}`
}

function formatUsageType(contentType: TagUsageItem['content_type'], t: (zh: string, en: string) => string) {
  if (contentType === 'post') return t('文章', 'Post')
  if (contentType === 'note') return t('笔记', 'Note')
  return t('项目', 'Project')
}
