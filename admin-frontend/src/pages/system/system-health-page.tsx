import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/components/ui/admin-page'
import { Card } from '@/components/ui/card'
import { useTranslation } from '@/features/i18n/use-translation'
import { getSystemHealth, getSystemPerformanceSummary } from '@/features/system/services/system-api'
import { ADMIN_SYSTEM_QUERY_STALE_TIME_MS } from '@/features/system/utils/system-query-options'
import { systemQueryKeys } from '@/features/system/utils/system-query-keys'

export function SystemHealthPage() {
  const { t } = useTranslation()
  const healthQuery = useQuery({
    queryKey: systemQueryKeys.health(),
    queryFn: getSystemHealth,
    staleTime: ADMIN_SYSTEM_QUERY_STALE_TIME_MS,
  })
  const performanceQuery = useQuery({
    queryKey: systemQueryKeys.performance(),
    queryFn: getSystemPerformanceSummary,
    staleTime: ADMIN_SYSTEM_QUERY_STALE_TIME_MS,
  })
  const data = healthQuery.data
  const performance = performanceQuery.data

  return (
    <div className="space-y-6">
      <PageHeader
        description={t('查看核心基础服务运行状态，并同步观察最近一段时间的接口性能摘要。', 'Review core infrastructure status and inspect recent API performance summaries.')}
        eyebrow={t('系统运维', 'System Operations')}
        meta={t('健康信息会按系统查询缓存策略刷新。', 'Health data refreshes according to the system query cache policy.')}
        title={t('健康检查', 'Health Check')}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title={t('整体状态', 'Overall Status')} description={t('当前内部健康检查结果', 'Latest internal health result')}>
          <div className="text-3xl font-semibold tracking-tight">{data?.status ?? 'loading'}</div>
        </Card>
        <Card title={t('数据库', 'Database')} description={t('数据库连接可用性', 'Database connectivity')}>
          <div className="text-3xl font-semibold tracking-tight">{String(data?.database ?? false)}</div>
        </Card>
        <Card title={t('缓存', 'Cache')} description={t('缓存读写可用性', 'Cache read/write availability')}>
          <div className="text-3xl font-semibold tracking-tight">{String(data?.cache ?? false)}</div>
        </Card>
        <Card title={t('搜索后端', 'Search Backend')} description={t('当前搜索引擎配置', 'Configured search engine')}>
          <div className="text-3xl font-semibold tracking-tight">{data?.search_backend ?? 'unknown'}</div>
        </Card>
        <Card title="Broker" description={t('消息队列是否已配置', 'Whether the message broker is configured')}>
          <div className="text-3xl font-semibold tracking-tight">{String(data?.broker_configured ?? false)}</div>
        </Card>
        <Card title={t('结果后端', 'Result Backend')} description={t('结果后端是否已配置', 'Whether the result backend is configured')}>
          <div className="text-3xl font-semibold tracking-tight">{String(data?.result_backend_configured ?? false)}</div>
        </Card>
      </section>

      <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-base font-semibold text-text">{t('接口性能概览', 'API Performance Summary')}</p>
            <p className="mt-1 text-sm leading-6 text-muted">
              {t(
                '查看后端最近一段时间的 API 请求耗时汇总，重点识别慢请求和高负载路由。',
                'Review recent API latency summaries to identify slow requests and higher-load routes.',
              )}
            </p>
          </div>
          <div className="text-xs text-muted">
            {t('慢请求阈值', 'Slow Threshold')}: {performance?.slow_threshold_ms ?? '-'}ms
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InlineMetricCard label={t('总请求数', 'Total Requests')} value={String(performance?.total_requests ?? '-')} />
          <InlineMetricCard label={t('慢请求数', 'Slow Requests')} value={String(performance?.slow_requests ?? '-')} />
          <InlineMetricCard label={t('平均耗时', 'Average Duration')} value={performance ? `${performance.avg_duration_ms} ms` : '-'} />
          <InlineMetricCard label={t('最大耗时', 'Max Duration')} value={performance ? `${performance.max_duration_ms} ms` : '-'} />
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-background/70 p-4 text-sm leading-6 text-muted">
          <p>
            {t(
              '请求响应会附带 Server-Timing 响应头，便于在浏览器网络面板中直接查看服务端耗时。',
              'Responses include a Server-Timing header so server duration can be inspected directly in browser network panels.',
            )}
          </p>
          <p className="mt-2">
            {t('统计窗口更新时间', 'Window Updated At')}: {performance?.window_updated_at ?? '-'}
          </p>
        </div>

        <div className="admin-table mt-5 overflow-hidden">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="px-4 py-3 font-medium">{t('路由', 'Route')}</th>
                <th className="px-4 py-3 font-medium">{t('分类', 'Category')}</th>
                <th className="px-4 py-3 font-medium">{t('请求数', 'Requests')}</th>
                <th className="px-4 py-3 font-medium">{t('平均耗时', 'Avg')}</th>
                <th className="px-4 py-3 font-medium">{t('最大耗时', 'Max')}</th>
                <th className="px-4 py-3 font-medium">{t('最近状态', 'Last Status')}</th>
              </tr>
            </thead>
            <tbody>
              {performance?.top_routes.map((item) => (
                <tr key={`${item.method}-${item.route}`} className="border-t border-border transition hover:bg-background/60">
                  <td className="px-4 py-3 align-top">
                    <div className="space-y-1">
                      <p className="font-medium text-text">{item.route}</p>
                      <p className="text-xs text-muted">
                        {item.method} · {item.path}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.category}</td>
                  <td className="px-4 py-3 text-muted">
                    {item.count}
                    <span className="ml-2 text-xs text-muted/80">
                      {t('慢请求', 'Slow')}: {item.slow_requests}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.avg_duration_ms} ms</td>
                  <td className="px-4 py-3 text-muted">{item.max_duration_ms} ms</td>
                  <td className="px-4 py-3 text-muted">
                    {item.last_status_code}
                    <div className="mt-1 text-xs text-muted/80">{item.last_seen_at}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!performanceQuery.isLoading && !performanceQuery.error && (performance?.top_routes.length ?? 0) === 0 ? (
            <div className="px-4 py-4 text-sm text-muted">
              {t('当前还没有可展示的接口性能记录。', 'No API performance records are available yet.')}
            </div>
          ) : null}
        </div>

        {performanceQuery.isLoading ? (
          <p className="mt-3 text-sm text-muted">{t('接口性能概览加载中...', 'Loading API performance summary...')}</p>
        ) : null}
        {performanceQuery.error ? (
          <p className="mt-3 text-sm text-danger">
            {t('接口性能概览加载失败，请稍后重试。', 'Failed to load the API performance summary. Please try again later.')}
          </p>
        ) : null}
      </section>
    </div>
  )
}

function InlineMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[18px] border border-border bg-background/70 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-text">{value}</p>
    </article>
  )
}
