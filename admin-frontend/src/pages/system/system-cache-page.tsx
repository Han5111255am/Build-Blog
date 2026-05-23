import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/app/providers/toast-provider'
import { MetricCard as AdminMetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import { getSystemCacheSummary, invalidateSystemCache } from '@/features/system/services/system-api'
import { ADMIN_SYSTEM_QUERY_STALE_TIME_MS } from '@/features/system/utils/system-query-options'
import { systemQueryKeys } from '@/features/system/utils/system-query-keys'
import type { ApiErrorResponse } from '@/types/api'
import { cn } from '@/utils/cn'

const scopes = ['posts', 'notes', 'projects', 'photos', 'podcasts', 'home', 'all_content']

export function SystemCachePage() {
  const queryClient = useQueryClient()
  const { pushToast } = useToast()
  const { t, translateOptional } = useTranslation()
  const [scope, setScope] = useState('all_content')

  const cacheQuery = useQuery({
    queryKey: systemQueryKeys.cache(),
    queryFn: getSystemCacheSummary,
    staleTime: ADMIN_SYSTEM_QUERY_STALE_TIME_MS,
  })
  const summary = cacheQuery.data

  const invalidateMutation = useMutation({
    mutationFn: invalidateSystemCache,
    onSuccess: async (response) => {
      pushToast({
        title: t('缓存刷新已提交', 'Cache Refresh Submitted'),
        description: translateOptional(response.message),
        tone: 'success',
      })
      await queryClient.invalidateQueries({ queryKey: systemQueryKeys.cache() })
    },
    onError: (error) => {
      const apiError = error as unknown as ApiErrorResponse
      pushToast({
        title: t('缓存刷新失败', 'Cache Refresh Failed'),
        description: translateOptional(apiError.message) || t('请稍后重试。', 'Please try again later.'),
        tone: 'error',
      })
    },
  })

  const scopeHint = useMemo(
    () =>
      scopes.includes(scope)
        ? ''
        : t(
            '该缓存范围不在建议列表中，提交前请再次确认。',
            'This cache scope is not in the recommended list. Confirm it before submitting.',
          ),
    [scope, t],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        description={t('查看缓存统计并执行缓存失效。', 'Review cache metrics and trigger cache invalidation.')}
        eyebrow={t('系统运维', 'System Operations')}
        meta={t('建议优先选择明确范围，必要时再刷新全量内容缓存。', 'Prefer specific scopes before refreshing all content cache.')}
        title={t('缓存状态', 'Cache Status')}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard detail={t('缓存键总量', 'Total cache keys')} label={t('键数量', 'Keys')} value={summary ? String(summary.keys) : '-'} />
        <AdminMetricCard detail={t('当前缓存占用', 'Current cache usage')} label={t('内存占用', 'Memory')} value={summary ? `${summary.memory_mb} MB` : '-'} />
        <AdminMetricCard detail={t('近期命中比例', 'Recent hit ratio')} label={t('命中率', 'Hit Rate')} value={summary ? `${Math.round(summary.hit_rate * 100)}%` : '-'} />
      </section>

      <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
        <p className="text-base font-semibold text-text">{t('缓存失效', 'Cache Invalidation')}</p>
        <p className="mt-2 text-sm leading-6 text-muted">
          {t('选择缓存范围并提交刷新任务。', 'Choose a cache scope and submit the refresh task.')}
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Input
            label={t('缓存范围', 'Scope')}
            onValueChange={setScope}
            placeholder="all_content"
            value={scope}
          />
          <Button
            loading={invalidateMutation.isPending}
            onClick={() => void invalidateMutation.mutateAsync({ scope })}
            type="button"
          >
            {t('刷新缓存', 'Refresh Cache')}
          </Button>
        </div>
        {scopeHint ? <p className="mt-2 text-xs text-muted">{scopeHint}</p> : null}
        <div className="mt-3 flex flex-wrap gap-2">
          {scopes.map((value) => (
            <button
              key={value}
              className={cn('admin-button-sm transition', scope === value ? 'admin-button-primary' : 'admin-button-secondary')}
              onClick={() => setScope(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          {t('更新时间', 'Updated At')}: {summary?.updated_at ?? '-'}
        </p>
        {cacheQuery.isLoading ? (
          <p className="mt-2 text-sm text-muted">{t('加载中...', 'Loading...')}</p>
        ) : null}
        {cacheQuery.error ? (
          <p className="mt-2 text-sm text-danger">
            {t('缓存状态加载失败，请稍后重试。', 'Failed to load cache status. Please try again later.')}
          </p>
        ) : null}
      </section>
    </div>
  )
}
