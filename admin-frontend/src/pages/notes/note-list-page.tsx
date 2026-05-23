import { useCallback, useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import { NoteBulkActions } from '@/features/notes/components/note-bulk-actions'
import { NoteTable } from '@/features/notes/components/note-table'
import {
  batchDeleteNotes,
  batchPublishNotes,
  batchUnpublishNotes,
  deleteNote,
  getNoteList,
  publishNote,
  unpublishNote,
} from '@/features/notes/services/note-api'
import type { NoteListItem } from '@/features/notes/types/note'
import { parseNoteListSearch } from '@/features/notes/utils/note-list-search-params'
import { noteQueryKeys } from '@/features/notes/utils/note-query-keys'
import { useDebouncedValue } from '@/hooks/use-debounced-value'
import type { ApiErrorResponse } from '@/types/api'

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm?: () => void
}

const defaultConfirmState: ConfirmState = {
  open: false,
  title: '',
  description: '',
}

export function NoteListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const search = useSearch({ from: '/app/notes' })
  const params = useMemo(() => parseNoteListSearch(search), [search])
  const [searchDraft, setSearchDraft] = useState(params.search)
  const debouncedSearchDraft = useDebouncedValue(searchDraft, 300)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [actionMessage, setActionMessage] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)

  const listQuery = useQuery({
    queryKey: noteQueryKeys.list(params),
    queryFn: () => getNoteList(params),
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

  const invalidateNotes = async () => {
    await queryClient.invalidateQueries({ queryKey: noteQueryKeys.lists() })
  }

  const actionMutation = useMutation({
    mutationFn: async (runner: () => Promise<{ message: string }>) => runner(),
    onSuccess: async (result) => {
      const message = translateOptional(result.message) || result.message
      setActionMessage(message)
      pushToast({
        title: t('笔记操作已完成', 'Note Action Completed'),
        description: message,
        tone: 'success',
      })
      await invalidateNotes()
    },
    onError: (requestError) => {
      const apiError = requestError as unknown as ApiErrorResponse
      const message =
        translateOptional(apiError.message) ||
        t('笔记操作未完成，请稍后重试。', 'The note action did not complete. Please try again later.')
      setActionMessage(message)
      pushToast({
        title: t('笔记操作未完成', 'Note Action Failed'),
        description: message,
        tone: 'error',
      })
    },
  })

  const busy = actionMutation.isPending
  const error = listQuery.error as ApiErrorResponse | null

  const noteSummary = {
    total: data.count,
    draft: data.results.filter((item) => item.status === 'draft').length,
    published: data.results.filter((item) => item.status === 'published').length,
  }

  const updateSearch = useCallback((patch: Partial<typeof params>) => {
    navigate({ to: '/notes', search: { ...params, ...patch }, replace: true })
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

  const runAction = (runner: () => Promise<{ message: string }>) => {
    setActionMessage('')
    actionMutation.mutate(runner)
  }

  const currentVisibleIds = data.results.map((row) => row.id)
  const selectedVisibleIds = selectedIds.filter((id) => currentVisibleIds.includes(id))

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => navigate({ to: '/notes/new', search: params })} type="button">
                {t('新建笔记', 'New Note')}
              </Button>
              <button className="admin-button-secondary" type="button">
                {t('导出列表', 'Export List')}
              </button>
            </div>
          }
          description={t('查看、筛选和维护笔记内容。', 'Review, filter, and maintain note content.')}
          eyebrow={t('内容库', 'Content Library')}
          meta={actionMessage || t('适合快速记录、发布和归档短内容。', 'Designed for quick notes, publishing, and archiving.')}
          title={t('笔记管理', 'Note Management')}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard detail={t('当前筛选结果', 'Current filter result')} label={t('笔记总数', 'Total Notes')} value={noteSummary.total} />
          <MetricCard detail={t('待发布', 'Pending publish')} label={t('草稿笔记', 'Draft Notes')} value={noteSummary.draft} />
          <MetricCard detail={t('已上线', 'Live')} label={t('已发布笔记', 'Published Notes')} value={noteSummary.published} />
        </section>

        <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          <div className="grid gap-4 md:grid-cols-4">
            <FilterField
              label={t('搜索', 'Search')}
              onChange={setSearchDraft}
              placeholder={t('标题 / 摘要 / slug', 'title / summary / slug')}
              value={searchDraft}
            />
            <FilterField
              label={t('状态', 'Status')}
              onChange={(value) => updateSearch({ status: value as typeof params.status, page: 1 })}
              placeholder={t('draft / published', 'draft / published')}
              value={params.status}
            />
            <FilterField
              label={t('语言', 'Language')}
              onChange={(value) => updateSearch({ lang: value as typeof params.lang, page: 1 })}
              placeholder={t('zh / en', 'zh / en')}
              value={params.lang}
            />
            <FilterField
              label={t('排序', 'Ordering')}
              onChange={(value) => updateSearch({ ordering: value, page: 1 })}
              placeholder={t('updated_at / published_at', 'updated_at / published_at')}
              value={params.ordering}
            />
          </div>
        </section>

        <NoteBulkActions
          busy={busy}
          onBatchDelete={() =>
            setConfirmState({
              open: true,
              title: t('确认删除选中笔记？', 'Delete Selected Notes?'),
              description: t(
                `已选中的 ${selectedVisibleIds.length} 条笔记将被删除，删除后不可恢复。`,
                `${selectedVisibleIds.length} selected note(s) will be deleted. This cannot be undone.`,
              ),
              onConfirm: () => runAction(() => batchDeleteNotes(selectedVisibleIds)),
            })
          }
          onBatchPublish={() => runAction(() => batchPublishNotes(selectedVisibleIds))}
          onBatchUnpublish={() => runAction(() => batchUnpublishNotes(selectedVisibleIds))}
          selectedCount={selectedVisibleIds.length}
        />

        <NoteTable
          busy={busy}
          data={data}
          error={translateOptional(error?.message)}
          listSearchParams={params}
          loading={listQuery.isLoading}
          onDelete={(row: NoteListItem) =>
            setConfirmState({
              open: true,
              title: t(`确认删除笔记 #${row.id}？`, `Delete Note #${row.id}?`),
              description: t(
                '笔记删除后不可恢复，并会从当前列表中移除。',
                'This note cannot be restored after deletion and will be removed from the current list.',
              ),
              onConfirm: () => runAction(() => deleteNote(row.id)),
            })
          }
          onPageChange={(page) => updateSearch({ page })}
          onPublish={(row: NoteListItem) => runAction(() => publishNote(row.id))}
          onRetry={() => void listQuery.refetch()}
          onToggleSelect={(id, checked) =>
            setSelectedIds((current) =>
              checked
                ? Array.from(new Set([...current, id]))
                : current.filter((item) => item !== id),
            )
          }
          onToggleSelectAll={(checked) => setSelectedIds(checked ? currentVisibleIds : [])}
          onUnpublish={(row: NoteListItem) => runAction(() => unpublishNote(row.id))}
          selectedIds={selectedVisibleIds}
        />
      </div>

      <ConfirmDialog
        confirmLabel={t('删除笔记', 'Delete Note')}
        danger
        description={confirmState.description}
        loading={busy}
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
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
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
