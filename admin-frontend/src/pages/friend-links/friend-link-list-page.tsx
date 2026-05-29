import { useCallback, useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import {
  approveFriendLink,
  deleteFriendLink,
  getFriendLinkList,
  rejectFriendLink,
  updateFriendLink,
} from '@/features/friend-links/services/friend-link-api'
import type {
  FriendLinkItem,
  FriendLinkMutationPayload,
  FriendLinkStatus,
} from '@/features/friend-links/types/friend-link'
import { friendLinkQueryKeys } from '@/features/friend-links/utils/friend-link-query-keys'
import { parseFriendLinkListSearch } from '@/features/friend-links/utils/friend-link-list-search-params'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api'

interface ConfirmState {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  danger?: boolean
  onConfirm?: () => void
}

const defaultConfirmState: ConfirmState = {
  open: false,
  title: '',
  description: '',
  confirmLabel: '',
}

export function FriendLinkListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const search = useSearch({ from: '/app/friend-links' })
  const params = useMemo(() => parseFriendLinkListSearch(search), [search])
  const [searchDraft, setSearchDraft] = useState(params.search)
  const [reviewNote, setReviewNote] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)
  const debouncedSearchDraft = useDebouncedValue(searchDraft, 300)

  const listQuery = useQuery({
    queryKey: friendLinkQueryKeys.list(params),
    queryFn: () => getFriendLinkList(params),
    placeholderData: keepPreviousData,
  })
  const data = listQuery.data ?? {
    count: 0,
    page: params.page,
    page_size: params.page_size,
    total_pages: 1,
    results: [],
  }
  const error = listQuery.error as ApiErrorResponse | null

  const mutation = useMutation({
    mutationFn: async (runner: () => Promise<ApiSuccessResponse<unknown>>) => runner(),
    onSuccess: async (result) => {
      pushToast({
        title: t('友链操作已完成', 'Friend Link Action Completed'),
        description: translateOptional(result.message) || result.message,
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: friendLinkQueryKeys.lists() })
    },
    onError: (requestError) => {
      const apiError = requestError as unknown as ApiErrorResponse
      pushToast({
        title: t('友链操作失败', 'Friend Link Action Failed'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const updateSearch = useCallback((patch: Partial<typeof params>) => {
    navigate({ to: '/friend-links', search: { ...params, ...patch }, replace: true })
  }, [navigate, params])

  useEffect(() => {
    setSearchDraft(params.search)
  }, [params.search])

  useEffect(() => {
    if (debouncedSearchDraft === params.search) {
      return
    }

    updateSearch({ search: debouncedSearchDraft, page: 1 })
  }, [debouncedSearchDraft, params.search, updateSearch])

  const statusCounts = useMemo(() => {
    return data.results.reduce<Record<FriendLinkStatus, number>>(
      (acc, item) => {
        acc[item.status] += 1
        return acc
      },
      { pending: 0, approved: 0, rejected: 0, hidden: 0 },
    )
  }, [data.results])

  function hideOrRestore(row: FriendLinkItem, nextStatus: 'approved' | 'hidden') {
    const payload = toMutationPayload(row, nextStatus)
    mutation.mutate(() => updateFriendLink(row.id, payload))
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          description={t(
            '审核访客提交的友链申请，只有通过审核的站点会出现在博客前台友链页。',
            'Review submitted friend link applications. Only approved sites appear on the public friends page.',
          )}
          eyebrow={t('内容审核', 'Content Review')}
          meta={t(
            '建议优先确认站点可访问、Logo 可加载、内容适合公开展示。',
            'Check site reachability, logo loading, and whether the content is suitable for public display.',
          )}
          title={t('友链管理', 'Friend Links')}
        />

        <section className="grid gap-4 md:grid-cols-4">
          <MetricCard detail={t('当前筛选结果', 'Current filter result')} label={t('友链总数', 'Total Links')} value={data.count} />
          <MetricCard detail={t('等待人工审核', 'Waiting for review')} label={t('待审核', 'Pending')} tone="warning" value={statusCounts.pending} />
          <MetricCard detail={t('前台公开展示', 'Visible publicly')} label={t('已通过', 'Approved')} tone="success" value={statusCounts.approved} />
          <MetricCard detail={t('隐藏或拒绝', 'Hidden or rejected')} label={t('未展示', 'Not Visible')} tone="neutral" value={statusCounts.hidden + statusCounts.rejected} />
        </section>

        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-4">
            <FilterField
              label={t('搜索', 'Search')}
              onChange={setSearchDraft}
              placeholder={t('站点名 / URL / 邮箱', 'site name / URL / email')}
              value={searchDraft}
            />
            <SelectField
              label={t('状态', 'Status')}
              onChange={(value) => updateSearch({ status: value as typeof params.status, page: 1 })}
              value={params.status}
            />
            <FilterField
              label={t('排序', 'Ordering')}
              onChange={(value) => updateSearch({ ordering: value, page: 1 })}
              placeholder="-updated_at"
              value={params.ordering}
            />
            <FilterField
              label={t('每页数量', 'Page Size')}
              onChange={(value) => updateSearch({ page_size: Number(value) || 20, page: 1 })}
              placeholder="20"
              value={String(params.page_size)}
            />
          </div>
          <label className="mt-4 flex flex-col gap-2 text-sm text-text">
            <span className="text-[13px] font-semibold">{t('审核备注', 'Review Note')}</span>
            <input
              className="admin-input h-11 px-4 text-sm placeholder:text-muted"
              onChange={(event) => setReviewNote(event.target.value)}
              placeholder={t('拒绝时会写入该备注，也可留空。', 'Used when rejecting; optional.')}
              value={reviewNote}
            />
          </label>
        </section>

        <section className="admin-table overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
            <p className="text-sm font-medium text-text">{t('申请列表', 'Application List')}</p>
            <p className="text-xs leading-5 text-muted">
              {t('通过后立即进入公开接口；隐藏会从前台移除但保留记录。', 'Approval makes the link public immediately; hiding removes it from the public page while keeping the record.')}
            </p>
          </div>

          {listQuery.isLoading ? (
            <StatusPanel
              description={t('正在同步友链申请列表。', 'Syncing friend link applications.')}
              title={t('正在加载友链数据', 'Loading Friend Links')}
            />
          ) : null}
          {!listQuery.isLoading && error ? (
            <StatusPanel
              actionLabel={t('重新获取', 'Reload')}
              description={translateOptional(error.message) || t('友链列表加载失败，请稍后重试。', 'Failed to load friend links. Please try again later.')}
              onAction={() => void listQuery.refetch()}
              title={t('友链列表加载失败', 'Failed to Load Friend Links')}
            />
          ) : null}
          {!listQuery.isLoading && !error && data.results.length === 0 ? (
            <StatusPanel
              description={t('当前筛选条件下没有友链申请。', 'No friend link applications match the current filters.')}
              title={t('暂无友链数据', 'No Friend Links')}
            />
          ) : null}
          {!listQuery.isLoading && !error && data.results.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr>
                    <th className="px-4 py-3 font-medium">{t('站点', 'Site')}</th>
                    <th className="px-4 py-3 font-medium">{t('状态', 'Status')}</th>
                    <th className="px-4 py-3 font-medium">{t('排序', 'Order')}</th>
                    <th className="px-4 py-3 font-medium">{t('联系信息', 'Contact')}</th>
                    <th className="px-4 py-3 font-medium">{t('最后更新', 'Updated At')}</th>
                    <th className="px-4 py-3 font-medium">{t('操作', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((row) => (
                    <tr key={row.id} className="border-t border-border text-sm transition hover:bg-background/60">
                      <td className="min-w-[260px] px-4 py-4">
                        <div className="flex items-start gap-3">
                          <img
                            alt={row.site_name}
                            className="h-12 w-12 shrink-0 rounded-full border border-border object-cover"
                            src={row.logo_url}
                          />
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-text">{row.site_name}</p>
                            <a className="block truncate text-xs text-brand hover:underline" href={row.site_url} rel="noreferrer" target="_blank">
                              {row.site_url}
                            </a>
                            <p className="line-clamp-2 text-xs leading-5 text-muted">{row.description || t('暂无简介', 'No description')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={statusClassName(row.status)}>
                          {statusLabel(row.status, t)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted">#{row.display_order}</td>
                      <td className="min-w-[220px] px-4 py-4 text-xs leading-5 text-muted">
                        <p>{row.contact_email || t('未填写邮箱', 'No email')}</p>
                        <p className="line-clamp-2">{row.contact_note || row.review_note || t('暂无备注', 'No note')}</p>
                      </td>
                      <td className="px-4 py-4 text-muted">{row.updated_at}</td>
                      <td className="px-4 py-4">
                        <div className="flex min-w-[260px] flex-wrap gap-2">
                          <TableAction
                            disabled={row.status === 'approved' || mutation.isPending}
                            label={t('通过', 'Approve')}
                            onClick={() => mutation.mutate(() => approveFriendLink(row.id, row.display_order || data.count + 1))}
                          />
                          <TableAction
                            disabled={row.status === 'rejected' || mutation.isPending}
                            label={t('拒绝', 'Reject')}
                            onClick={() => mutation.mutate(() => rejectFriendLink(row.id, reviewNote))}
                          />
                          {row.status === 'hidden' ? (
                            <TableAction
                              disabled={mutation.isPending}
                              label={t('恢复展示', 'Restore')}
                              onClick={() => hideOrRestore(row, 'approved')}
                            />
                          ) : (
                            <TableAction
                              disabled={mutation.isPending}
                              label={t('隐藏', 'Hide')}
                              onClick={() => hideOrRestore(row, 'hidden')}
                            />
                          )}
                          <TableAction
                            danger
                            disabled={mutation.isPending}
                            label={t('删除', 'Delete')}
                            onClick={() => setConfirmState({
                              open: true,
                              danger: true,
                              title: t(`确认删除友链 #${row.id}？`, `Delete Friend Link #${row.id}?`),
                              description: t('删除后不可恢复，前台展示也会同步移除。', 'This cannot be restored and will also remove it from the public page.'),
                              confirmLabel: t('删除', 'Delete'),
                              onConfirm: () => mutation.mutate(() => deleteFriendLink(row.id)),
                            })}
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
        confirmLabel={confirmState.confirmLabel || t('确认', 'Confirm')}
        danger={confirmState.danger}
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

function toMutationPayload(row: FriendLinkItem, status: FriendLinkStatus): FriendLinkMutationPayload {
  return {
    site_name: row.site_name,
    site_url: row.site_url,
    logo_url: row.logo_url,
    description: row.description,
    contact_email: row.contact_email,
    contact_note: row.contact_note,
    review_note: row.review_note,
    status,
    display_order: row.display_order,
  }
}

function statusLabel(status: FriendLinkStatus, t: (zh: string, en: string) => string) {
  if (status === 'approved') return t('已通过', 'Approved')
  if (status === 'rejected') return t('已拒绝', 'Rejected')
  if (status === 'hidden') return t('已隐藏', 'Hidden')
  return t('待审核', 'Pending')
}

function statusClassName(status: FriendLinkStatus) {
  if (status === 'approved') return 'admin-status bg-[rgba(47,158,111,0.12)] text-success'
  if (status === 'rejected') return 'admin-status bg-[rgba(208,68,68,0.1)] text-danger'
  if (status === 'hidden') return 'admin-status bg-[rgba(107,114,128,0.12)] text-muted'
  return 'admin-status bg-[rgba(200,138,46,0.12)] text-warning'
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

function SelectField({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  const { t } = useTranslation()

  return (
    <label className="flex flex-col gap-2 text-sm text-text">
      <span className="text-[13px] font-semibold">{label}</span>
      <select
        className="admin-select h-11 px-4 text-sm"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">{t('全部状态', 'All Statuses')}</option>
        <option value="pending">{t('待审核', 'Pending')}</option>
        <option value="approved">{t('已通过', 'Approved')}</option>
        <option value="rejected">{t('已拒绝', 'Rejected')}</option>
        <option value="hidden">{t('已隐藏', 'Hidden')}</option>
      </select>
    </label>
  )
}

function TableAction({
  danger = false,
  disabled = false,
  label,
  onClick,
}: {
  danger?: boolean
  disabled?: boolean
  label: string
  onClick?: () => void
}) {
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
          <button className="admin-button-secondary" onClick={onAction} type="button">
            {actionLabel}
          </button>
        </div>
      ) : null}
    </div>
  )
}
