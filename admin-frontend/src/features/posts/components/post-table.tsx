import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from '@/features/i18n/use-translation'
import type { PostListItem, PostListParams } from '@/features/posts/types/post'
import type { PaginatedData } from '@/types/api'
import { cn } from '@/utils/cn'

interface PostTableProps {
  data: PaginatedData<PostListItem>
  loading?: boolean
  error?: string
  selectedIds: number[]
  busy?: boolean
  listSearchParams: PostListParams
  onRetry?: () => void
  onPageChange: (page: number) => void
  onToggleSelect: (id: number, checked: boolean) => void
  onToggleSelectAll: (checked: boolean) => void
  onPublish: (row: PostListItem) => void
  onUnpublish: (row: PostListItem) => void
  onDelete: (row: PostListItem) => void
}

export function PostTable({
  busy = false,
  data,
  error,
  loading = false,
  listSearchParams,
  onDelete,
  onPageChange,
  onPublish,
  onRetry,
  onToggleSelect,
  onToggleSelectAll,
  onUnpublish,
  selectedIds,
}: PostTableProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const allSelected =
    data.results.length > 0 && data.results.every((row) => selectedIds.includes(row.id))

  if (loading) {
    return (
      <StatePanel
        title={t('正在加载文章列表', 'Loading Posts')}
        description={t(
          '正在同步筛选条件并请求管理端数据，请稍候。',
          'Syncing filters and requesting admin data. Please wait.',
        )}
      />
    )
  }
  if (error) {
    return (
      <StatePanel
        actionLabel={t('重试', 'Retry')}
        description={error}
        onAction={onRetry}
        title={t('文章列表加载失败', 'Failed to Load Posts')}
      />
    )
  }
  if (data.results.length === 0) {
    return (
      <StatePanel
        actionLabel={t('新建文章', 'New Post')}
        description={t(
          '当前筛选条件下没有文章，可调整筛选条件或直接创建新内容。',
          'No posts match the current filters. Adjust the filters or create a new post.',
        )}
        onAction={() => navigate({ to: '/posts/new', search: listSearchParams })}
        title={t('暂无匹配文章', 'No Matching Posts')}
      />
    )
  }

  return (
    <section className="admin-table overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[1080px] w-full table-fixed border-collapse text-left">
          <thead>
            <tr>
              <th className="w-14 px-4 py-3">
                <input
                  aria-label={t('选择当前页全部文章', 'Select all posts on this page')}
                  checked={allSelected}
                  onChange={(event) => onToggleSelectAll(event.target.checked)}
                  type="checkbox"
                />
              </th>
              <th className="px-4 py-3">{t('标题', 'Title')}</th>
              <th className="w-20 whitespace-nowrap px-4 py-3">
                {t('语言', 'Language')}
              </th>
              <th className="w-28 whitespace-nowrap px-4 py-3">
                {t('状态', 'Status')}
              </th>
              <th className="w-32 whitespace-nowrap px-4 py-3">
                {t('最后更新', 'Updated At')}
              </th>
              <th className="w-48 whitespace-nowrap px-4 py-3">
                {t('操作', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((row) => {
              const checked = selectedIds.includes(row.id)
              return (
                <tr key={row.id} className="border-t border-border text-sm transition hover:bg-background/60">
                  <td className="align-top px-4 py-4">
                    <input
                      aria-label={t(`选择文章 ${row.title}`, `Select post ${row.title}`)}
                      checked={checked}
                      onChange={(event) => onToggleSelect(row.id, event.target.checked)}
                      type="checkbox"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="break-words font-semibold text-text">{row.title}</p>
                      <p className="break-all text-xs text-muted">ID #{row.id} / {row.slug}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted">{row.lang}</td>
                  <td className="whitespace-nowrap px-4 py-4">
                    <span
                      className={`admin-status min-w-[4rem] ${row.status === 'published' ? 'bg-[rgba(47,158,111,0.12)] text-success' : 'bg-[rgba(200,138,46,0.12)] text-warning'}`}
                    >
                      {row.status === 'published'
                        ? t('已发布', 'Published')
                        : t('草稿', 'Draft')}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-muted">{row.updated_at}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <TableAction
                        label={t('编辑', 'Edit')}
                        onClick={() =>
                          navigate({
                            to: '/posts/$id',
                            params: { id: String(row.id) },
                            search: listSearchParams,
                          })
                        }
                      />
                      <TableAction
                        label={
                          row.status === 'published'
                            ? t('转为草稿', 'Move to Draft')
                            : t('发布', 'Publish')
                        }
                        onClick={() =>
                          row.status === 'published' ? onUnpublish(row) : onPublish(row)
                        }
                      />
                      <TableAction
                        danger
                        disabled={busy}
                        label={t('删除', 'Delete')}
                        onClick={() => onDelete(row)}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm text-muted md:flex-row md:items-center md:justify-between">
        <p>
          {t(
            `第 ${data.page} 页，共 ${data.total_pages} 页 / 每页 ${data.page_size} 条 / 共 ${data.count} 条`,
            `Page ${data.page} of ${data.total_pages} / ${data.page_size} per page / ${data.count} total`,
          )}
        </p>
        <div className="flex items-center gap-2">
          <PagerButton
            disabled={data.page <= 1}
            label={t('上一页', 'Previous')}
            onClick={() => onPageChange(data.page - 1)}
          />
          <PagerButton active label={String(data.page)} onClick={() => onPageChange(data.page)} />
          <PagerButton
            disabled={data.page >= data.total_pages}
            label={t('下一页', 'Next')}
            onClick={() => onPageChange(data.page + 1)}
          />
        </div>
      </div>
    </section>
  )
}

function StatePanel({
  actionLabel,
  description,
  onAction,
  title,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <section className="rounded-[20px] border border-border bg-surface p-8 text-center shadow-soft">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-text">{title}</h2>
        <p className="text-sm leading-6 text-muted">{description}</p>
        {actionLabel ? (
          <button
            className="admin-button-secondary px-4 py-2 text-sm font-semibold"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </section>
  )
}

interface TableActionProps {
  danger?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
}

function TableAction({ danger = false, disabled = false, label, onClick }: TableActionProps) {
  return (
    <button
      className={`${danger ? 'admin-button-danger' : 'admin-button-secondary'} admin-button-sm ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

interface PagerButtonProps {
  active?: boolean
  disabled?: boolean
  label: string
  onClick: () => void
}

function PagerButton({ active = false, disabled = false, label, onClick }: PagerButtonProps) {
  return (
    <button
      className={cn(
        'admin-button-sm transition',
        active ? 'admin-button-primary' : 'admin-button-secondary',
        disabled ? 'cursor-not-allowed opacity-50' : '',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}
