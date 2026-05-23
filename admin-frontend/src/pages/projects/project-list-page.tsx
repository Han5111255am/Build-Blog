import { useCallback, useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import {
  deleteProject,
  getProjectList,
  reorderProjects,
} from '@/features/projects/services/project-api'
import { parseProjectListSearch } from '@/features/projects/utils/project-list-search-params'
import { projectQueryKeys } from '@/features/projects/utils/project-query-keys'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ApiErrorResponse } from '@/types/api'

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm?: () => void
}

const defaultConfirmState: ConfirmState = { open: false, title: '', description: '' }

export function ProjectListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const search = useSearch({ from: '/app/projects' })
  const params = useMemo(() => parseProjectListSearch(search), [search])
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)
  const [orderedIds, setOrderedIds] = useState<number[]>([])
  const [actionMessage, setActionMessage] = useState('')
  const [searchDraft, setSearchDraft] = useState(params.search)
  const debouncedSearchDraft = useDebouncedValue(searchDraft, 300)

  const listQuery = useQuery({
    queryKey: projectQueryKeys.list(params),
    queryFn: () => getProjectList(params),
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
      pushToast({
        title: t('项目操作已完成', 'Project Action Completed'),
        description: message,
        tone: 'success',
      })
      setOrderedIds(resultIds)
      await queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() })
    },
    onError: (requestError) => {
      const apiError = requestError as unknown as ApiErrorResponse
      const message =
        translateOptional(apiError.message) ||
        t('项目操作未完成，请稍后重试。', 'The project action did not complete. Please try again later.')
      setActionMessage(message)
      pushToast({
        title: t('项目操作未完成', 'Project Action Failed'),
        description: message,
        tone: 'error',
      })
    },
  })

  const updateSearch = useCallback((patch: Partial<typeof params>) => {
    navigate({ to: '/projects', search: { ...params, ...patch }, replace: true })
  }, [navigate, params])

  const resultIds = useMemo(() => data.results.map((item) => item.id), [data.results])
  const rowMap = useMemo(() => new Map(data.results.map((item) => [item.id, item])), [data.results])
  const isReorderView =
    params.search === '' &&
    params.lang === '' &&
    params.status === '' &&
    params.ordering === 'display_order'
  const canReorder =
    isReorderView &&
    params.page === 1 &&
    data.total_pages === 1 &&
    data.results.length > 1

  useEffect(() => {
    setOrderedIds(resultIds)
  }, [resultIds])

  useEffect(() => {
    setSearchDraft(params.search)
  }, [params.search])

  useEffect(() => {
    if (debouncedSearchDraft === params.search) {
      return
    }

    updateSearch({ search: debouncedSearchDraft, page: 1 })
  }, [debouncedSearchDraft, params.search, updateSearch])

  const orderedRows = useMemo(() => {
    const activeIds = orderedIds.length ? orderedIds : resultIds
    return activeIds
      .map((id) => rowMap.get(id))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [orderedIds, resultIds, rowMap])

  const hasDraftOrdering =
    canReorder &&
    orderedIds.length === resultIds.length &&
    orderedIds.some((id, index) => id !== resultIds[index])

  const reorderHint = !isReorderView
    ? t(
        '请先切换到默认排序视图并清空筛选条件，再执行项目排序。',
        'Switch to the default ordering view and clear filters before reordering projects.',
      )
    : params.page !== 1
      ? t(
          '排序仅支持在第一页执行，请先返回第一页。',
          'Reordering is available only on the first page. Return to page one first.',
        )
      : data.total_pages > 1
        ? t(
            '当前未加载全部项目，请先载入全部项目后再调整顺序。',
            'All projects must be loaded before reordering.',
          )
        : data.results.length <= 1
          ? t(
              '至少需要两个项目才能调整展示顺序。',
              'At least two projects are required to adjust display order.',
            )
          : t(
              '通过置顶、上移、下移、置底调整顺序，然后统一保存。',
              'Use top, up, down, and bottom controls, then save the ordering in one batch.',
            )

  function resetLocalOrdering() {
    setOrderedIds(resultIds)
  }

  function enterReorderView() {
    updateSearch({
      search: '',
      lang: '',
      status: '',
      ordering: 'display_order',
      page: 1,
    })
  }

  function loadAllProjectsForReorder() {
    updateSearch({
      page: 1,
      page_size: Math.max(params.page_size, data.count),
    })
  }

  function moveRow(rowId: number, mode: 'top' | 'up' | 'down' | 'bottom') {
    setOrderedIds((current) => {
      const base = current.length ? [...current] : [...resultIds]
      const currentIndex = base.indexOf(rowId)
      if (currentIndex === -1)
        return base

      if (mode === 'top' && currentIndex > 0) {
        base.splice(currentIndex, 1)
        base.unshift(rowId)
        return base
      }

      if (mode === 'bottom' && currentIndex < base.length - 1) {
        base.splice(currentIndex, 1)
        base.push(rowId)
        return base
      }

      if (mode === 'up' && currentIndex > 0) {
        ;[base[currentIndex - 1], base[currentIndex]] = [base[currentIndex], base[currentIndex - 1]]
      }

      if (mode === 'down' && currentIndex < base.length - 1) {
        ;[base[currentIndex], base[currentIndex + 1]] = [base[currentIndex + 1], base[currentIndex]]
      }

      return base
    })
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => navigate({ to: '/projects/new', search: params })}
                type="button"
              >
                {t('新建项目', 'New Project')}
              </Button>
              <button
                className="admin-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canReorder || !hasDraftOrdering || mutation.isPending}
                onClick={() => mutation.mutate(() => reorderProjects(orderedIds))}
                title={
                  !canReorder
                    ? reorderHint
                    : !hasDraftOrdering
                      ? t('当前没有待保存的顺序变更。', 'There are no ordering changes to save.')
                      : mutation.isPending
                        ? t('排序保存中，请等待当前请求完成。', 'Ordering is being saved. Wait for the current request to finish.')
                        : undefined
                }
                type="button"
              >
                {t('保存排序', 'Save Ordering')}
              </button>
            </div>
          }
          description={t('查看、筛选和维护项目条目。', 'Review, filter, and maintain projects.')}
          eyebrow={t('内容库', 'Content Library')}
          meta={actionMessage || t('支持展示顺序调整与项目发布状态维护。', 'Supports display ordering and project publishing state maintenance.')}
          title={t('项目管理', 'Project Management')}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard detail={t('当前筛选结果', 'Current filter result')} label={t('项目总数', 'Total Projects')} value={data.count} />
          <MetricCard detail={t('已上线', 'Live')} label={t('已发布项目', 'Published Projects')} value={data.results.filter((item) => item.status === 'published').length} />
          <MetricCard detail={t('待发布', 'Pending publish')} label={t('草稿项目', 'Draft Projects')} value={data.results.filter((item) => item.status === 'draft').length} />
        </section>

        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-4">
            <FilterField
              label={t('搜索', 'Search')}
              onChange={setSearchDraft}
              placeholder={t('项目名 / slug', 'project title / slug')}
              value={searchDraft}
            />
            <FilterField
              label={t('语言', 'Language')}
              onChange={(value) => updateSearch({ lang: value as typeof params.lang, page: 1 })}
              placeholder={t('zh / en', 'zh / en')}
              value={params.lang}
            />
            <FilterField
              label={t('状态', 'Status')}
              onChange={(value) =>
                updateSearch({ status: value as typeof params.status, page: 1 })
              }
              placeholder={t('draft / published', 'draft / published')}
              value={params.status}
            />
            <FilterField
              label={t('排序', 'Ordering')}
              onChange={(value) => updateSearch({ ordering: value, page: 1 })}
              placeholder={t('display_order / updated_at', 'display_order / updated_at')}
              value={params.ordering}
            />
          </div>
        </section>

        <section className="admin-table overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-text">{t('展示顺序', 'Display Order')}</p>
              <p className="text-xs leading-6 text-muted">{reorderHint}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!isReorderView ? (
                <button
                  className="admin-button-secondary min-h-9 px-3 py-2 text-sm"
                  onClick={enterReorderView}
                  type="button"
                >
                  {t('切换到排序视图', 'Switch to Reorder View')}
                </button>
              ) : null}
              {isReorderView && data.total_pages > 1 ? (
                <button
                  className="admin-button-secondary min-h-9 px-3 py-2 text-sm"
                  onClick={loadAllProjectsForReorder}
                  type="button"
                >
                  {t('载入全部项目', 'Load All Projects')}
                </button>
              ) : null}
              <button
                className="admin-button-secondary min-h-9 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!hasDraftOrdering || mutation.isPending}
                onClick={resetLocalOrdering}
                title={
                  !hasDraftOrdering
                    ? t('当前没有本地顺序变更可重置。', 'There are no local ordering changes to reset.')
                    : mutation.isPending
                      ? t('排序保存中，请等待完成后再重置。', 'Ordering is being saved. Wait for completion before resetting.')
                      : undefined
                }
                type="button"
              >
                {t('重置顺序', 'Reset Ordering')}
              </button>
            </div>
          </div>
          {listQuery.isLoading ? (
            <StatusPanel
              description={t(
                '正在同步当前筛选结果。',
                'Syncing the current project filter results.',
              )}
              title={t('正在加载项目数据', 'Loading Projects')}
            />
          ) : null}
          {!listQuery.isLoading && error ? (
            <StatusPanel
              actionLabel={t('重新获取', 'Reload')}
              description={
                translateOptional(error.message) ||
                t('项目列表加载失败，请稍后重试。', 'Failed to load projects. Please try again later.')
              }
              onAction={() => void listQuery.refetch()}
              title={t('项目列表加载失败', 'Failed to Load Projects')}
            />
          ) : null}
          {!listQuery.isLoading && !error && data.results.length === 0 ? (
            <StatusPanel
              description={t(
                '当前筛选条件下暂无项目，可调整筛选或直接新建项目。',
                'No projects match the current filters. Adjust the filters or create a new project.',
              )}
              title={t('暂无项目数据', 'No Project Data')}
            />
          ) : null}
          {!listQuery.isLoading && !error && data.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('项目', 'Project')}</th>
                    <th className="px-4 py-3 font-medium">{t('语言', 'Language')}</th>
                    <th className="px-4 py-3 font-medium">{t('状态', 'Status')}</th>
                    <th className="px-4 py-3 font-medium">{t('展示顺序', 'Display Order')}</th>
                    <th className="px-4 py-3 font-medium">{t('最后更新', 'Updated At')}</th>
                    <th className="px-4 py-3 font-medium">{t('操作', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedRows.map((row, index) => (
                    <tr key={row.id} className="border-t border-border text-sm transition hover:bg-background/60">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-semibold text-text">{row.title}</p>
                          <p className="text-xs text-muted">ID #{row.id} / {row.slug}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">{row.lang}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`admin-status ${row.status === 'published' ? 'bg-[rgba(47,158,111,0.12)] text-success' : 'bg-[rgba(200,138,46,0.12)] text-warning'}`}
                        >
                          {row.status === 'published'
                            ? t('已发布', 'Published')
                            : t('草稿', 'Draft')}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text">#{index + 1}</p>
                          {row.display_order !== index + 1 ? (
                            <p className="text-xs text-warning">
                              {t(`原顺序 #${row.display_order}`, `Was #${row.display_order}`)}
                            </p>
                          ) : (
                            <p className="text-xs text-muted">
                              {t('已与当前顺序一致', 'Matches the current ordering')}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">{row.updated_at}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <TableAction
                            label={t('编辑', 'Edit')}
                            onClick={() => navigate({ to: '/projects/$id', params: { id: String(row.id) }, search: params })}
                          />
                          <TableAction
                            disabled={!canReorder || index === 0}
                            title={buildMoveActionHint('top', canReorder, index, orderedRows.length, t)}
                            label={t('置顶', 'Top')}
                            onClick={() => moveRow(row.id, 'top')}
                          />
                          <TableAction
                            disabled={!canReorder || index === 0}
                            title={buildMoveActionHint('up', canReorder, index, orderedRows.length, t)}
                            label={t('上移', 'Move Up')}
                            onClick={() => moveRow(row.id, 'up')}
                          />
                          <TableAction
                            disabled={!canReorder || index === orderedRows.length - 1}
                            title={buildMoveActionHint('down', canReorder, index, orderedRows.length, t)}
                            label={t('下移', 'Move Down')}
                            onClick={() => moveRow(row.id, 'down')}
                          />
                          <TableAction
                            disabled={!canReorder || index === orderedRows.length - 1}
                            title={buildMoveActionHint('bottom', canReorder, index, orderedRows.length, t)}
                            label={t('置底', 'Bottom')}
                            onClick={() => moveRow(row.id, 'bottom')}
                          />
                          <TableAction
                            danger
                            label={t('删除项目', 'Delete Project')}
                            onClick={() =>
                              setConfirmState({
                                open: true,
                                title: t(
                                  `确认删除项目 #${row.id}？`,
                                  `Delete Project #${row.id}?`,
                                ),
                                description: t(
                                  '项目删除后不可恢复，并会从当前列表中移除。',
                                  'This project cannot be restored after deletion and will be removed from the current list.',
                                ),
                                onConfirm: () => mutation.mutate(() => deleteProject(row.id)),
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        confirmLabel={t('删除项目', 'Delete Project')}
        danger
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

function FilterField({
  label,
  onChange,
  placeholder,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="text-[13px] font-semibold">{label}</span>
      <input
        className="admin-input h-11 px-4 text-sm placeholder:text-muted"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </label>
  )
}

function TableAction({
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
      className={`${danger ? 'admin-button-danger' : 'admin-button-secondary'} admin-button-sm ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? title : undefined}
      type="button"
    >
      {label}
    </button>
  )
}

function buildMoveActionHint(
  mode: 'top' | 'up' | 'down' | 'bottom',
  canReorder: boolean,
  index: number,
  total: number,
  t: (zh: string, en: string) => string,
) {
  if (!canReorder) {
    return t(
      '请先进入排序视图并载入可重排的数据后，再调整项目顺序。',
      'Open the reorder view with reorderable data before adjusting project order.',
    )
  }

  if ((mode === 'top' || mode === 'up') && index === 0) {
    return t('当前项目已经在最前面，不能继续上移。', 'This project is already at the top.')
  }

  if ((mode === 'down' || mode === 'bottom') && index === total - 1) {
    return t('当前项目已经在最后面，不能继续下移。', 'This project is already at the bottom.')
  }

  return ''
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
