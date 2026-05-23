import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/providers/toast-provider'
import { PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/features/i18n/use-translation'
import { getSystemTasks, retrySystemTask } from '@/features/system/services/system-api'
import type { SystemTaskItem } from '@/features/system/types/system'
import { ADMIN_SYSTEM_QUERY_STALE_TIME_MS } from '@/features/system/utils/system-query-options'
import { systemQueryKeys } from '@/features/system/utils/system-query-keys'
import type { ApiErrorResponse } from '@/types/api'
import { cn } from '@/utils/cn'

export function SystemTasksPage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const tasksQuery = useQuery({
    queryKey: systemQueryKeys.tasks(),
    queryFn: getSystemTasks,
    staleTime: ADMIN_SYSTEM_QUERY_STALE_TIME_MS,
  })
  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data])
  const statusLabelMap: Record<SystemTaskItem['status'], string> = {
    pending: t('待处理', 'Pending'),
    running: t('进行中', 'Running'),
    success: t('正常', 'Healthy'),
    failed: t('失败', 'Failed'),
  }
  const categoryLabelMap: Record<SystemTaskItem['category'], string> = {
    system: t('系统', 'System'),
    celery: t('队列', 'Queue'),
    content: t('内容', 'Content'),
    search: t('搜索', 'Search'),
  }

  useEffect(() => {
    if (tasks.length === 0) {
      setSelectedTaskId(null)
      return
    }
    if (selectedTaskId && tasks.some((task) => task.id === selectedTaskId)) {
      return
    }
    const preferredTask = tasks.find((task) => task.status === 'failed') ?? tasks[0]
    setSelectedTaskId(preferredTask.id)
  }, [selectedTaskId, tasks])

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null
  const statusSummary = useMemo(
    () => ({
      failed: tasks.filter((task) => task.status === 'failed').length,
      pending: tasks.filter((task) => task.status === 'pending').length,
      running: tasks.filter((task) => task.status === 'running').length,
      success: tasks.filter((task) => task.status === 'success').length,
    }),
    [tasks],
  )

  const retryMutation = useMutation({
    mutationFn: retrySystemTask,
    onSuccess: async (response) => {
      pushToast({
        title: t('任务操作已提交', 'Task Action Submitted'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.tasks() })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('任务操作失败', 'Task Action Failed'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        description={t(
          '查看系统、队列、内容和搜索任务的当前状态，定位失败项并执行最小重试操作。',
          'Review system, queue, content, and search tasks, locate failures, and trigger minimal retries.',
        )}
        eyebrow={t('系统运维', 'System Operations')}
        meta={t('优先查看失败项，其次关注队列和内容积压。', 'Prioritize failed items, then inspect queue and content backlog.')}
        title={t('任务状态', 'Task Status')}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label={t('失败任务', 'Failed Tasks')} tone="failed" value={statusSummary.failed} />
        <SummaryCard label={t('待处理任务', 'Pending Tasks')} tone="pending" value={statusSummary.pending} />
        <SummaryCard label={t('进行中任务', 'Running Tasks')} tone="running" value={statusSummary.running} />
        <SummaryCard label={t('正常任务', 'Healthy Tasks')} tone="success" value={statusSummary.success} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
        <article className="admin-table overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="text-base font-semibold text-text">{t('任务列表', 'Task List')}</p>
              <p className="mt-1 text-sm text-muted">
                {t(
                  '优先查看失败项，其次关注队列和内容积压。',
                  'Prioritize failed items, then inspect queue and content backlog.',
                )}
              </p>
            </div>
            <button
              className="admin-button-secondary"
              onClick={() => void tasksQuery.refetch()}
              type="button"
            >
              {t('刷新列表', 'Refresh')}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="px-4 py-3 font-medium">{t('任务', 'Task')}</th>
                  <th className="px-4 py-3 font-medium">{t('分类', 'Category')}</th>
                  <th className="px-4 py-3 font-medium">{t('状态', 'Status')}</th>
                  <th className="px-4 py-3 font-medium">{t('更新时间', 'Updated At')}</th>
                  <th className="px-4 py-3 font-medium">{t('摘要', 'Summary')}</th>
                  <th className="px-4 py-3 font-medium">{t('操作', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isSelected = task.id === selectedTaskId

                  return (
                    <tr
                      key={task.id}
                      className={cn(
                        'border-t border-border text-sm transition',
                        isSelected
                          ? 'bg-[rgba(0,113,227,0.07)]'
                          : 'hover:bg-background/60',
                      )}
                    >
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <p className="font-medium text-text">{task.name}</p>
                          <p className="text-xs text-muted">{task.id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted">{categoryLabelMap[task.category]}</td>
                      <td className="px-4 py-4">
                        <StatusPill label={statusLabelMap[task.status]} status={task.status} />
                      </td>
                      <td className="px-4 py-4 text-muted">{task.updated_at}</td>
                      <td className="px-4 py-4 text-muted">{task.message || '-'}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="admin-button-secondary admin-button-sm"
                            onClick={() => setSelectedTaskId(task.id)}
                            type="button"
                          >
                            {t('查看详情', 'View Detail')}
                          </button>
                          {task.retryable ? (
                            <Button
                              loading={retryMutation.isPending && retryMutation.variables === task.id}
                              onClick={() => void retryMutation.mutateAsync(task.id)}
                              type="button"
                            >
                              {task.action_label || t('重试', 'Retry')}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {tasksQuery.isLoading ? (
            <p className="px-5 py-4 text-sm text-muted">{t('任务列表加载中...', 'Loading task list...')}</p>
          ) : null}
          {tasksQuery.error ? (
            <p className="px-5 py-4 text-sm text-danger">
              {t('任务列表加载失败，请稍后重试。', 'Failed to load task list. Please try again later.')}
            </p>
          ) : null}
          {!tasksQuery.isLoading && !tasksQuery.error && tasks.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">
              {t('当前没有任务记录。', 'No task records are available.')}
            </p>
          ) : null}
        </article>

        <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
          {selectedTask ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">
                  {t('任务详情', 'Task Detail')}
                </p>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-text">{selectedTask.name}</h2>
                    <p className="mt-1 text-sm text-muted">
                      {selectedTask.message || t('暂无摘要信息。', 'No summary is available.')}
                    </p>
                  </div>
                  <StatusPill label={statusLabelMap[selectedTask.status]} status={selectedTask.status} />
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span className="rounded-full border border-border px-2.5 py-1">
                    {t('分类', 'Category')}: {categoryLabelMap[selectedTask.category]}
                  </span>
                  <span className="rounded-full border border-border px-2.5 py-1">
                    {t('更新时间', 'Updated At')}: {selectedTask.updated_at}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedTask.metrics.map((metric) => (
                  <div key={`${selectedTask.id}-${metric.label}`} className="rounded-2xl border border-border bg-background/70 p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted">{metric.label}</p>
                    <p className="mt-2 text-lg font-semibold text-text">{metric.value}</p>
                  </div>
                ))}
                {selectedTask.metrics.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border p-3 text-sm text-muted sm:col-span-2">
                    {t('当前没有可展示的任务指标。', 'There are no task metrics to display.')}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-text">{t('诊断详情', 'Diagnostic Details')}</p>
                <div className="space-y-2">
                  {selectedTask.details.map((detail) => (
                    <div key={`${selectedTask.id}-${detail}`} className="rounded-2xl border border-border bg-background/70 px-3 py-2 text-sm text-muted">
                      {detail}
                    </div>
                  ))}
                  {selectedTask.details.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted">
                      {t('当前没有更多诊断详情。', 'No further diagnostic details are available.')}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-text">{t('最近事件', 'Recent Events')}</p>
                <div className="space-y-2">
                  {selectedTask.events.map((event, index) => (
                    <div
                      key={`${event.id}-${index}`}
                      className="rounded-2xl border border-border bg-background/70 px-3 py-2 text-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 font-medium',
                            event.level === 'info' && 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
                            event.level === 'warning' && 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
                            event.level === 'error' && 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
                          )}
                        >
                          {event.level}
                        </span>
                        <span>{event.source}</span>
                        <span>{event.time ?? '-'}</span>
                      </div>
                      <p className="mt-2 text-sm text-text">{event.message}</p>
                    </div>
                  ))}
                  {selectedTask.events.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted">
                      {t('当前没有可展示的事件日志。', 'There are no event logs to display.')}
                    </p>
                  ) : null}
                </div>
              </div>

              {selectedTask.retryable ? (
                <Button
                  loading={retryMutation.isPending && retryMutation.variables === selectedTask.id}
                  onClick={() => void retryMutation.mutateAsync(selectedTask.id)}
                  type="button"
                >
                  {selectedTask.action_label || t('重试', 'Retry')}
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[260px] items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
              {t('选择左侧任务可查看详细信息。', 'Select a task on the left to inspect details.')}
            </div>
          )}
        </article>
      </section>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: SystemTaskItem['status']
}) {
  const { t } = useTranslation()
  const statusLabelMap: Record<SystemTaskItem['status'], string> = {
    pending: t('待处理', 'Pending'),
    running: t('进行中', 'Running'),
    success: t('正常', 'Healthy'),
    failed: t('失败', 'Failed'),
  }

  return (
    <article className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-text">{value}</p>
        </div>
        <StatusPill label={statusLabelMap[tone]} status={tone} />
      </div>
    </article>
  )
}

function StatusPill({
  label,
  status,
}: {
  label: string
  status: SystemTaskItem['status']
}) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
        status === 'success' && 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
        status === 'pending' && 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
        status === 'running' && 'bg-sky-500/12 text-sky-700 dark:text-sky-300',
        status === 'failed' && 'bg-rose-500/12 text-rose-700 dark:text-rose-300',
      )}
    >
      {label}
    </span>
  )
}
