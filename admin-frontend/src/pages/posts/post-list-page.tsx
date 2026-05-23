import { useCallback, useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useTranslation } from '@/features/i18n/use-translation'
import { PostBulkActions } from '@/features/posts/components/post-bulk-actions'
import { PostFilterBar } from '@/features/posts/components/post-filter-bar'
import { PostTable } from '@/features/posts/components/post-table'
import {
  batchDeletePosts,
  batchPublishPosts,
  batchUnpublishPosts,
  deletePost,
  getPostList,
  publishPost,
  unpublishPost,
} from '@/features/posts/services/post-api'
import { parsePostListSearch } from '@/features/posts/utils/post-list-search-params'
import { postQueryKeys } from '@/features/posts/utils/post-query-keys'
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

export function PostListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const search = useSearch({ from: '/app/posts' })
  const params = useMemo(() => parsePostListSearch(search), [search])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [actionMessage, setActionMessage] = useState('')
  const [confirmState, setConfirmState] = useState<ConfirmState>(defaultConfirmState)

  const listQuery = useQuery({
    queryKey: postQueryKeys.list(params),
    queryFn: () => getPostList(params),
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

  const invalidatePosts = async () => {
    await queryClient.invalidateQueries({ queryKey: postQueryKeys.lists() })
  }

  const actionMutation = useMutation({
    mutationFn: async (runner: () => Promise<{ message: string }>) => runner(),
    onSuccess: async (result) => {
      const message = translateOptional(result.message) || result.message
      setActionMessage(message)
      pushToast({
        title: t('文章操作已完成', 'Post Action Completed'),
        description: message,
        tone: 'success',
      })
      await invalidatePosts()
    },
    onError: (requestError) => {
      const apiError = requestError as unknown as ApiErrorResponse
      const message =
        translateOptional(apiError.message) ||
        t('文章操作未完成，请稍后重试。', 'The post action did not complete. Please try again later.')
      setActionMessage(message)
      pushToast({
        title: t('文章操作未完成', 'Post Action Failed'),
        description: message,
        tone: 'error',
      })
    },
  })

  const busy = actionMutation.isPending
  const error = listQuery.error as ApiErrorResponse | null

  const postSummary = {
    total: data.count,
    draft: data.results.filter((item) => item.status === 'draft').length,
    published: data.results.filter((item) => item.status === 'published').length,
  }

  const updateSearch = useCallback((patch: Partial<typeof params>) => {
    navigate({ to: '/posts', search: { ...params, ...patch }, replace: true })
  }, [navigate, params])

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
          eyebrow={t('文章', 'Posts')}
          title={t('文章管理', 'Post Management')}
          description={t('查看、筛选和维护文章内容。', 'Review, filter, and maintain post content.')}
          meta={actionMessage}
          actions={
            <>
            <Button onClick={() => navigate({ to: '/posts/new', search: params })} type="button">
              {t('新建文章', 'New Post')}
            </Button>
            <button
              className="admin-button-secondary px-4 py-2.5 text-sm font-semibold"
              type="button"
            >
              {t('导出列表', 'Export List')}
            </button>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label={t('文章总数', 'Total Posts')}
            detail={t('当前筛选结果', 'Current filter result')}
            value={postSummary.total}
          />
          <MetricCard
            label={t('草稿文章', 'Draft Posts')}
            detail={t('待发布', 'Pending publish')}
            tone="warning"
            value={postSummary.draft}
          />
          <MetricCard
            label={t('已发布文章', 'Published Posts')}
            detail={t('已上线', 'Live')}
            tone="success"
            value={postSummary.published}
          />
        </section>

        <PostFilterBar onChange={updateSearch} value={params} />
        <PostBulkActions
          busy={busy}
          onBatchDelete={() =>
            setConfirmState({
              open: true,
              title: t('确认删除选中文章？', 'Delete Selected Posts?'),
              description: t(
                `已选中的 ${selectedVisibleIds.length} 篇文章将被删除，删除后不可恢复。`,
                `${selectedVisibleIds.length} selected post(s) will be deleted. This cannot be undone.`,
              ),
              onConfirm: () => runAction(() => batchDeletePosts(selectedVisibleIds)),
            })
          }
          onBatchPublish={() => runAction(() => batchPublishPosts(selectedVisibleIds))}
          onBatchUnpublish={() => runAction(() => batchUnpublishPosts(selectedVisibleIds))}
          selectedCount={selectedVisibleIds.length}
        />
        <PostTable
          busy={busy}
          data={data}
          error={translateOptional(error?.message)}
          listSearchParams={params}
          loading={listQuery.isLoading}
          onDelete={(row) =>
            setConfirmState({
              open: true,
              title: t(`确认删除文章 #${row.id}？`, `Delete Post #${row.id}?`),
              description: t(
                '文章删除后不可恢复，并会从当前列表中移除。',
                'This post cannot be restored after deletion and will be removed from the current list.',
              ),
              onConfirm: () => runAction(() => deletePost(row.id)),
            })
          }
          onPageChange={(page) => updateSearch({ page })}
          onPublish={(row) => runAction(() => publishPost(row.id))}
          onRetry={() => void listQuery.refetch()}
          onToggleSelect={(id, checked) =>
            setSelectedIds((current) =>
              checked
                ? Array.from(new Set([...current, id]))
                : current.filter((item) => item !== id),
            )
          }
          onToggleSelectAll={(checked) => setSelectedIds(checked ? currentVisibleIds : [])}
          onUnpublish={(row) => runAction(() => unpublishPost(row.id))}
          selectedIds={selectedVisibleIds}
        />
      </div>

      <ConfirmDialog
        confirmLabel={t('删除文章', 'Delete Post')}
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
