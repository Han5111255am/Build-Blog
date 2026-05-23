import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import { createTag, deleteTag, getTagList } from '@/features/tags/services/tag-api'
import { parseTagListSearch } from '@/features/tags/utils/tag-list-search-params'
import { tagQueryKeys } from '@/features/tags/utils/tag-query-keys'
import type { ApiErrorResponse } from '@/types/api'

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm?: () => void
}

const defaultConfirmState: ConfirmState = { open: false, title: '', description: '' }

export function TagListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const search = useSearch({ from: '/app/tags' })
  const params = useMemo(() => parseTagListSearch(search), [search])
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)
  const [tagName, setTagName] = useState('')
  const [tagSlug, setTagSlug] = useState('')
  const [filterSearch, setFilterSearch] = useState(params.search)
  const [actionMessage, setActionMessage] = useState('')

  const listQuery = useQuery({
    queryKey: tagQueryKeys.list(params),
    queryFn: () => getTagList(params),
    placeholderData: keepPreviousData,
  })
  const data =
    listQuery.data ?? {
      count: 0,
      page: params.page,
      page_size: params.page_size,
      total_pages: 1,
      results: [],
    }
  const error = listQuery.error as ApiErrorResponse | null
  const mutation = useMutation({
    mutationFn: async (runner: () => Promise<{ message: string }>) => runner(),
    onSuccess: async (result) => {
      const message = translateOptional(result.message) || result.message
      setActionMessage(message)
      setTagName('')
      setTagSlug('')
      pushToast({
        title: t('标签操作已完成', 'Tag Action Completed'),
        description: message,
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: tagQueryKeys.lists() })
    },
    onError: (requestError) => {
      const apiError = requestError as unknown as ApiErrorResponse
      const message =
        translateOptional(apiError.message) ||
        t('标签操作未完成，请稍后重试。', 'The tag action did not complete. Please try again later.')
      setActionMessage(message)
      pushToast({
        title: t('标签操作未完成', 'Tag Action Failed'),
        description: message,
        tone: 'error',
      })
    },
  })

  const updateSearch = (patch: Partial<typeof params>) => {
    navigate({ to: '/tags', search: { ...params, ...patch }, replace: true })
  }

  const quickCreateDisabledReason = mutation.isPending
    ? t('标签正在创建中，请等待当前请求完成。', 'The tag is being created. Wait for the current request to finish.')
    : !tagName.trim() && !tagSlug.trim()
      ? t('请先填写标签名称和别名，再创建标签。', 'Enter both a tag name and slug before creating the tag.')
      : !tagName.trim()
        ? t('请先填写标签名称。', 'Enter a tag name before creating the tag.')
        : !tagSlug.trim()
          ? t('请先填写标签别名。', 'Enter a tag slug before creating the tag.')
          : ''

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <Button onClick={() => navigate({ to: '/tags/new', search: params })} type="button">
              {t('新建标签', 'New Tag')}
            </Button>
          }
          description={t('维护标签元数据和引用状态。', 'Maintain tag metadata and usage status.')}
          eyebrow={t('全局属性', 'Global Metadata')}
          meta={actionMessage || t('删除前会检查引用关系。', 'References are checked before deletion.')}
          title={t('标签管理', 'Tag Management')}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard detail={t('当前筛选结果下的标签数量', 'Tags in the current filter result')} label={t('标签总数', 'Total Tags')} value={data.count} />
          <MetricCard
            detail={t('已被内容模块引用的标签', 'Tags currently referenced by content')}
            label={t('被引用标签', 'Referenced Tags')}
            value={data.results.filter((item) => item.post_count + item.note_count + item.project_count > 0).length}
          />
          <MetricCard
            detail={t('当前未被引用，可安全清理的标签', 'Tags that are safe to remove')}
            label={t('可删除标签', 'Removable Tags')}
            value={data.results.filter((item) => item.post_count + item.note_count + item.project_count === 0).length}
          />
        </section>

        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-3">
            <Field
              label={t('搜索', 'Search')}
              onChange={setFilterSearch}
              placeholder={t('名称 / slug / 说明', 'name / slug / description')}
              value={filterSearch}
            />
            <Field
              label={t('排序', 'Ordering')}
              onChange={() => undefined}
              placeholder={t('name / updated_at', 'name / updated_at')}
              readOnly
              value={params.ordering}
            />
            <div className="flex items-end">
              <button
                className="admin-button-secondary h-11 px-4 text-sm"
                onClick={() => updateSearch({ search: filterSearch, page: 1 })}
                type="button"
              >
                {t('应用筛选', 'Apply Filters')}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <Card title={t('快速创建', 'Quick Create')} description={t('新增标签', 'Create a new tag')}>
            <div className="space-y-4">
              <Field
                label={t('标签名称', 'Tag Name')}
                onChange={setTagName}
                placeholder={t('例如：性能优化', 'Example: Performance Optimization')}
                value={tagName}
              />
              <Field
                label={t('标签别名', 'Tag Slug')}
                onChange={setTagSlug}
                placeholder={t('performance', 'performance')}
                value={tagSlug}
              />
              <Field
                disabled
                label={t('颜色', 'Color')}
                onChange={() => undefined}
                placeholder={t('#6366F1', '#6366F1')}
                value="#6366F1"
              />
              <p className="text-xs text-muted">
                {t(
                  '快速创建默认使用 #6366F1；如需自定义颜色，可在创建后进入详情页继续编辑。',
                  'Quick create uses #6366F1 by default. Edit the tag detail later if you need a custom color.',
                )}
              </p>
              <Button
                disabled={!tagName.trim() || !tagSlug.trim() || mutation.isPending}
                onClick={() =>
                  mutation.mutate(() =>
                    createTag({
                      name: tagName,
                      slug: tagSlug,
                      color: '#6366F1',
                      description: '',
                    }),
                  )
                }
                title={quickCreateDisabledReason || undefined}
                type="button"
              >
                {t('新建标签', 'Create Tag')}
              </Button>
              <p className="text-xs text-muted">
                {quickCreateDisabledReason ||
                  t(
                    '名称和别名填写完成后即可直接创建标签。',
                    'Create the tag immediately after the name and slug are filled in.',
                  )}
              </p>
            </div>
          </Card>

          <section className="admin-table overflow-hidden">
            {listQuery.isLoading ? (
              <StatusPanel
                description={t(
                  '正在同步当前筛选结果。',
                  'Syncing the current tag filter results.',
                )}
                title={t('正在加载标签数据', 'Loading Tags')}
              />
            ) : null}
            {!listQuery.isLoading && error ? (
              <StatusPanel
                actionLabel={t('重新获取', 'Reload')}
                description={
                  translateOptional(error.message) ||
                  t('标签列表加载失败，请稍后重试。', 'Failed to load tags. Please try again later.')
                }
                onAction={() => void listQuery.refetch()}
                title={t('标签列表加载失败', 'Failed to Load Tags')}
              />
            ) : null}
            {!listQuery.isLoading && !error && data.results.length === 0 ? (
              <StatusPanel
                description={t(
                  '当前筛选条件下暂无标签，可调整筛选或直接新建标签。',
                  'No tags match the current filters. Adjust the filters or create a new tag.',
                )}
                title={t('暂无标签数据', 'No Tag Data')}
              />
            ) : null}
            {!listQuery.isLoading && !error && data.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 font-medium">{t('标签', 'Tag')}</th>
                      <th className="px-4 py-3 font-medium">{t('别名', 'Slug')}</th>
                      <th className="px-4 py-3 font-medium">{t('颜色', 'Color')}</th>
                      <th className="px-4 py-3 font-medium">{t('引用数量', 'Usage Count')}</th>
                      <th className="px-4 py-3 font-medium">{t('操作', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((tag) => {
                      const usageCount = tag.post_count + tag.note_count + tag.project_count
                      const canDelete = usageCount === 0
                      return (
                        <tr key={tag.id} className="border-t border-border text-sm transition hover:bg-background/60">
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <p className="font-semibold text-text">{tag.name}</p>
                              <p className="text-xs text-muted">ID #{tag.id}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-muted">{tag.slug}</td>
                          <td className="px-4 py-4">
                            <span className="inline-flex items-center gap-2 text-muted">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: tag.color }}
                              />
                              {tag.color}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`admin-status ${usageCount > 0 ? 'bg-[rgba(0,113,227,0.1)] text-brand' : 'bg-[rgba(47,158,111,0.12)] text-success'}`}
                            >
                              {usageCount}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <ActionChip
                                label={t('编辑', 'Edit')}
                                onClick={() =>
                                  navigate({
                                    to: '/tags/$id',
                                    params: { id: String(tag.id) },
                                    search: params,
                                  })
                                }
                              />
                              <ActionChip
                                danger
                                label={
                                  canDelete
                                    ? t('删除标签', 'Delete Tag')
                                    : t('无法删除', 'Cannot Delete')
                                }
                                onClick={() =>
                                  setConfirmState({
                                    open: true,
                                    title: canDelete
                                      ? t(
                                          `确认删除标签 #${tag.id}？`,
                                          `Delete Tag #${tag.id}?`,
                                        )
                                      : t('当前无法删除标签', 'This Tag Cannot Be Deleted'),
                                    description: canDelete
                                      ? t(
                                          '标签删除后不可恢复，并会从标签列表中移除。',
                                          'This tag cannot be restored after deletion and will be removed from the list.',
                                        )
                                      : t(
                                          `标签“${tag.name}”仍被内容引用，请先解除引用关系后再删除。`,
                                          `The tag "${tag.name}" is still in use. Remove the references before deleting it.`,
                                        ),
                                    onConfirm: canDelete
                                      ? () => mutation.mutate(() => deleteTag(tag.id))
                                      : undefined,
                                  })
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </section>
      </div>

      <ConfirmDialog
        confirmLabel={confirmState.onConfirm ? t('删除标签', 'Delete Tag') : t('关闭', 'Close')}
        danger={Boolean(confirmState.onConfirm)}
        description={confirmState.description}
        loading={mutation.isPending}
        onCancel={() => setConfirmState(defaultConfirmState)}
        onConfirm={() => {
          confirmState.onConfirm?.()
          setConfirmState(defaultConfirmState)
        }}
        open={confirmState.open}
        title={confirmState.title}
      />
    </>
  )
}

function Field({
  disabled = false,
  label,
  onChange,
  placeholder,
  readOnly = false,
  value,
}: {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  placeholder: string
  readOnly?: boolean
  value: string
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="text-[13px] font-semibold">{label}</span>
      <input
        className="admin-input h-11 px-4 text-sm placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        value={value}
      />
    </label>
  )
}

function ActionChip({
  danger = false,
  label,
  onClick,
}: {
  danger?: boolean
  label: string
  onClick?: () => void
}) {
  return (
    <button
      className={`${danger ? 'admin-button-danger' : 'admin-button-secondary'} admin-button-sm`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  )
}

function StatusPanel({
  actionLabel,
  description,
  onAction,
  title,
}: {
  actionLabel?: string
  description: string
  onAction?: () => void
  title: string
}) {
  return (
    <div className="rounded-[20px] border border-dashed border-border bg-background/70 px-5 py-8 text-center">
      <p className="text-base font-semibold text-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-4">
          <button
            className="admin-button-secondary"
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
