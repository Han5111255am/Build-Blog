import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MetricCard as AdminMetricCard, PageHeader } from '@/components/ui/admin-page'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTranslation } from '@/features/i18n/use-translation'
import { getSystemSearchStatus, testSystemSearch } from '@/features/system/services/system-api'
import { ADMIN_SYSTEM_QUERY_STALE_TIME_MS } from '@/features/system/utils/system-query-options'
import { systemQueryKeys } from '@/features/system/utils/system-query-keys'

export function SystemSearchPage() {
  const { language, t } = useTranslation()
  const [query, setQuery] = useState('')
  const statusQuery = useQuery({
    queryKey: systemQueryKeys.searchStatus(),
    queryFn: getSystemSearchStatus,
    staleTime: ADMIN_SYSTEM_QUERY_STALE_TIME_MS,
  })
  const testQuery = useQuery({
    queryKey: systemQueryKeys.searchTest(query),
    queryFn: () => testSystemSearch(query),
    enabled: false,
  })

  return (
    <div className="space-y-6">
      <PageHeader
        description={t('查看搜索服务状态并执行检索测试。', 'Review search service status and run retrieval tests.')}
        eyebrow={t('系统运维', 'System Operations')}
        meta={t('用于验证搜索索引与后端连通性。', 'Use this to verify search indexing and backend connectivity.')}
        title={t('搜索状态', 'Search Status')}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <AdminMetricCard detail={t('当前搜索引擎', 'Current search engine')} label={t('搜索后端', 'Backend')} value={statusQuery.data?.backend ?? '-'} />
        <AdminMetricCard detail={t('服务连通性', 'Service connectivity')} label={t('健康状态', 'Healthy')} value={String(statusQuery.data?.healthy ?? false)} />
        <AdminMetricCard detail={t('已索引内容', 'Indexed content')} label={t('文档数', 'Documents')} value={String(statusQuery.data?.indexed_documents ?? '-')} />
      </section>

      <section className="rounded-[20px] border border-border bg-surface p-5 shadow-soft">
        <p className="text-base font-semibold text-text">{t('检索测试', 'Search Test')}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <Input
            label={t('关键词', 'Keyword')}
            onValueChange={setQuery}
            placeholder={t('输入关键词后点击测试', 'Enter a keyword and run the test')}
            value={query}
          />
          <Button onClick={() => void testQuery.refetch()} type="button">
            {t('执行检索', 'Run Search')}
          </Button>
        </div>

        {testQuery.isFetching ? (
          <p className="mt-3 text-sm text-muted">{t('检索中...', 'Searching...')}</p>
        ) : null}
        {testQuery.error ? (
          <p className="mt-3 text-sm text-danger">
            {t('检索失败，请稍后重试。', 'Search failed. Please try again later.')}
          </p>
        ) : null}
        {testQuery.data ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted">
              {t('响应时间', 'Response Time')}: {testQuery.data.took_ms}ms
            </p>
            <div className="space-y-2">
              {testQuery.data.results.map((item) => (
                <div key={buildSearchResultKey(item)} className="rounded-2xl border border-border bg-background/70 p-3 text-sm">
                  <p className="font-medium text-text">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {language === 'en'
                      ? `${item.type} / score ${item.score}`
                      : `${item.type} / 分值 ${item.score}`}
                  </p>
                </div>
              ))}
              {testQuery.data.results.length === 0 ? (
                <p className="text-sm text-muted">{t('未找到结果。', 'No results found.')}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        <p className="mt-4 text-xs text-muted">
          {t('更新时间', 'Updated At')}: {statusQuery.data?.updated_at ?? '-'}
        </p>

        {statusQuery.isLoading ? (
          <p className="mt-2 text-sm text-muted">{t('状态加载中...', 'Loading status...')}</p>
        ) : null}
        {statusQuery.error ? (
          <p className="mt-2 text-sm text-danger">
            {t('搜索状态加载失败，请稍后重试。', 'Failed to load search status. Please try again later.')}
          </p>
        ) : null}
      </section>
    </div>
  )
}

function buildSearchResultKey(item: { id: string; type: string }) {
  return `${item.type}-${item.id}`
}
