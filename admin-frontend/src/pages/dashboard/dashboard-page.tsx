import { memo, useMemo, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDashboardOverview } from '@/features/dashboard/services/dashboard-api'
import { useTranslation } from '@/features/i18n/use-translation'
import type {
  DashboardActivityItem,
  DashboardAnalyticsOverview,
  DashboardAnalyticsReferrer,
  DashboardAnalyticsStatus,
  DashboardAnalyticsTrends,
  DashboardContentBreakdown,
  DashboardContentBreakdownItem,
  DashboardPublishingSnapshot,
  DashboardSummary,
  DashboardSystemOverview,
} from '@/features/dashboard/types/dashboard'
import { dashboardQueryKeys } from '@/features/dashboard/utils/dashboard-query-keys'
import { ADMIN_DASHBOARD_QUERY_STALE_TIME_MS } from '@/features/system/utils/system-query-options'
import { cn } from '@/utils/cn'

type Accent = 'ink' | 'violet' | 'teal' | 'amber' | 'rose'
type StatusState = 'ok' | 'warning' | 'muted' | 'error'

type Metric = {
  label: string
  value: string
  detail: string
  accent: Accent
  progress?: number
}

type CompositionItem = {
  label: string
  total: number
  published: number
  draft: number
  percent: number
  accent: Accent
}

type TodoItem = {
  label: string
  detail: string
  count: string
  state: StatusState
}

type StatusRow = {
  label: string
  value: string
  detail?: string
  state: StatusState
}

const accentTokens: Record<Accent, { bar: string; dot: string; fill: string; line: string; soft: string; text: string }> = {
  ink: {
    bar: 'var(--dashboard-ink)',
    dot: 'bg-zinc-950 dark:bg-zinc-100',
    fill: 'bg-zinc-950 dark:bg-zinc-100',
    line: 'bg-zinc-950 dark:bg-zinc-100',
    soft: 'bg-zinc-100 dark:bg-white/[0.10]',
    text: 'text-zinc-950 dark:text-zinc-100',
  },
  violet: {
    bar: 'var(--dashboard-violet)',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    fill: 'bg-indigo-500 dark:bg-indigo-400',
    line: 'bg-indigo-500 dark:bg-indigo-400',
    soft: 'bg-indigo-50 dark:bg-indigo-400/10',
    text: 'text-indigo-600 dark:text-indigo-300',
  },
  teal: {
    bar: 'var(--dashboard-teal)',
    dot: 'bg-teal-600 dark:bg-teal-400',
    fill: 'bg-teal-600 dark:bg-teal-400',
    line: 'bg-teal-600 dark:bg-teal-400',
    soft: 'bg-teal-50 dark:bg-teal-400/10',
    text: 'text-teal-700 dark:text-teal-300',
  },
  amber: {
    bar: 'var(--dashboard-amber)',
    dot: 'bg-amber-500 dark:bg-amber-400',
    fill: 'bg-amber-500 dark:bg-amber-400',
    line: 'bg-amber-500 dark:bg-amber-400',
    soft: 'bg-amber-50 dark:bg-amber-400/10',
    text: 'text-amber-700 dark:text-amber-300',
  },
  rose: {
    bar: 'var(--dashboard-rose)',
    dot: 'bg-rose-600 dark:bg-rose-400',
    fill: 'bg-rose-600 dark:bg-rose-400',
    line: 'bg-rose-600 dark:bg-rose-400',
    soft: 'bg-rose-50 dark:bg-rose-400/10',
    text: 'text-rose-700 dark:text-rose-300',
  },
}

const statusTokens: Record<StatusState, { dot: string; soft: string; text: string }> = {
  ok: { dot: 'bg-teal-600 dark:bg-teal-400', soft: 'bg-teal-50 dark:bg-teal-400/10', text: 'text-teal-700 dark:text-teal-300' },
  warning: { dot: 'bg-amber-500 dark:bg-amber-400', soft: 'bg-amber-50 dark:bg-amber-400/10', text: 'text-amber-700 dark:text-amber-300' },
  muted: { dot: 'bg-zinc-400 dark:bg-zinc-500', soft: 'bg-zinc-100 dark:bg-white/[0.06]', text: 'text-zinc-600 dark:text-zinc-300' },
  error: { dot: 'bg-rose-600 dark:bg-rose-400', soft: 'bg-rose-50 dark:bg-rose-400/10', text: 'text-rose-700 dark:text-rose-300' },
}

export function DashboardPage() {
  const { language, t } = useTranslation()
  const overviewQuery = useQuery({
    queryKey: dashboardQueryKeys.overview(),
    queryFn: getDashboardOverview,
    staleTime: ADMIN_DASHBOARD_QUERY_STALE_TIME_MS,
  })

  const data = overviewQuery.data
  const summary = data?.summary
  const system = data?.system_overview
  const publishing = data?.publishing_snapshot
  const analyticsStatus = data?.analytics_status
  const showAnalyticsPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('analyticsPreview') === 'umami'
  const analyticsPreview = showAnalyticsPreview ? buildAnalyticsPreviewData(t) : null
  const analyticsOverview = analyticsPreview?.overview ?? data?.analytics_overview
  const analyticsReferrers = analyticsPreview?.referrers ?? data?.analytics_referrers ?? []
  const analyticsTrends = analyticsPreview?.trends ?? data?.analytics_trends
  const resolvedAnalyticsStatus = analyticsPreview?.status ?? analyticsStatus
  const hasAnalyticsData = resolvedAnalyticsStatus?.data_state === 'available'
  const trendLabels = data?.trends.labels ?? []
  const updateValues = data?.trends.content_updates ?? []
  const publishValues = data?.trends.published_content ?? []
  const contentBreakdown = useMemo(() => buildContentBreakdownItems(data?.content_breakdown), [data?.content_breakdown])
  const composition = useMemo(() => buildComposition(contentBreakdown), [contentBreakdown])
  const totalContent = contentBreakdown.reduce((total, item) => total + item.value.total, 0)
  const completionRate = clampPercentage(system?.completion_rate ?? 0)
  const latestUpdate = publishing?.latest_update_at ?? publishing?.latest_publish_at

  const heroMetrics: Metric[] = [
    {
      accent: (summary?.pending_content ?? 0) > 0 ? 'amber' : 'teal',
      detail: t('待审核或待处理的内容数量', 'Content waiting for review or handling'),
      label: t('待处理内容', 'Pending Content'),
      value: formatMetricValue(summary?.pending_content),
    },
    {
      accent: 'ink',
      detail: t('当前已上线的内容总数', 'Total content currently published'),
      label: t('已发布内容', 'Published Content'),
      value: formatMetricValue(summary?.published_content),
    },
    {
      accent: 'violet',
      detail: t('媒体库当前可用文件', 'Available files in the media library'),
      label: t('素材总量', 'Media Assets'),
      value: formatMetricValue(summary?.assets),
    },
    {
      accent: (summary?.system_alerts ?? 0) > 0 ? 'rose' : 'teal',
      detail: systemStatusText(system, t),
      label: t('系统提醒', 'System Alerts'),
      value: formatMetricValue(summary?.system_alerts),
    },
  ]

  const secondaryMetrics: Metric[] = [
    {
      accent: 'teal',
      detail: t('内容更新次数', 'Content update count'),
      label: t('近7天更新', '7-Day Updates'),
      progress: normalizeProgress(publishing?.updates_last_7_days, Math.max(publishing?.updates_last_7_days ?? 0, publishing?.publishes_last_7_days ?? 0, 1)),
      value: formatMetricValue(publishing?.updates_last_7_days),
    },
    {
      accent: 'violet',
      detail: t('内容发布次数', 'Content publish count'),
      label: t('近7天发布', '7-Day Publishes'),
      progress: normalizeProgress(publishing?.publishes_last_7_days, Math.max(publishing?.updates_last_7_days ?? 0, publishing?.publishes_last_7_days ?? 0, 1)),
      value: formatMetricValue(publishing?.publishes_last_7_days),
    },
    {
      accent: (publishing?.stale_drafts ?? 0) > 0 ? 'amber' : 'teal',
      detail: t('需要回看的草稿', 'Drafts that need another pass'),
      label: t('滞留草稿', 'Stale Drafts'),
      progress: normalizeProgress(publishing?.stale_drafts, Math.max(publishing?.stale_drafts ?? 0, 1)),
      value: formatMetricValue(publishing?.stale_drafts),
    },
    {
      accent: completionRate >= 80 ? 'teal' : completionRate >= 50 ? 'amber' : 'rose',
      detail: t('基于已发布内容占比', 'Based on published content share'),
      label: t('发布完成度', 'Completion'),
      progress: completionRate,
      value: `${completionRate}%`,
    },
  ]

  const todoItems = buildTodoItems(summary, publishing, t)
  const statusRows = buildStatusRows(system, resolvedAnalyticsStatus, t)
  const recentItems = data?.recent_activity ?? []

  return (
    <div
      className="mx-auto w-full max-w-[1400px] pb-10 text-zinc-950 selection:bg-black selection:text-white dark:text-zinc-100 dark:[--dashboard-amber:#f59e0b] dark:[--dashboard-ink:#f4f4f5] dark:[--dashboard-rose:#fb7185] dark:[--dashboard-teal:#2dd4bf] dark:[--dashboard-violet:#818cf8] [--dashboard-amber:#d97706] [--dashboard-ink:#18181b] [--dashboard-rose:#be123c] [--dashboard-teal:#0f766e] [--dashboard-violet:#635bff]"
    >
      <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 sm:text-4xl">{t('运营概览', 'Operations Overview')}</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">
            {t('以更清晰的状态、节奏和质量管理你的个人博客。', 'Manage your personal blog with clearer status, rhythm, and quality signals.')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoPill label={t('内容周期', 'Content Period')} value={t('近7天', 'Last 7 Days')} />
          <InfoPill label={t('最新更新', 'Latest Update')} value={formatDateTime(latestUpdate, language, t)} />
        </div>
      </header>

      <main className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:gap-8">
        <section className="flex min-w-0 flex-col gap-6 xl:col-span-8 xl:gap-8">
          <HeroStatusCard
            isLoading={overviewQuery.isLoading}
            metrics={heroMetrics}
            subtitle={t('所有指标均来自当前后台已有的内容、素材、发布和系统状态数据。', 'All metrics are based on existing content, media, publishing, and system data.')}
            title={t('今日创作状态', 'Creative Status Today')}
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {secondaryMetrics.map((item) => (
              <MiniStatCard key={item.label} metric={item} />
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="min-h-[300px] lg:col-span-3">
              <SectionTitle
                subtitle={t('基于近 7 天内容更新与发布数据', 'Based on the last 7 days of updates and publishes')}
                title={t('内容节奏', 'Content Rhythm')}
              />
              <ContentRhythmChart labels={trendLabels} published={publishValues} updates={updateValues} />
            </Card>

            <Card className="min-h-[300px] lg:col-span-2">
              <SectionTitle
                subtitle={t('按当前内容类型统计总量、草稿和发布数量', 'Totals, drafts, and published counts by content type')}
                title={t('内容构成', 'Content Composition')}
              />
              <CompositionDonut items={composition} total={totalContent} />
            </Card>
          </div>

          {hasAnalyticsData ? (
            <AnalyticsOverviewPanel
              overview={analyticsOverview}
              preview={Boolean(analyticsPreview)}
              referrers={analyticsReferrers}
              status={resolvedAnalyticsStatus}
              trends={analyticsTrends}
            />
          ) : null}

          <Card className="p-1">
            <div className="p-5 pb-2">
              <SectionTitle
                subtitle={t('来自后台最近内容变更记录', 'From recent content activity records')}
                title={t('最近内容', 'Recent Content')}
              />
            </div>
            <div className="grid gap-2 p-3 md:grid-cols-3">
              {recentItems.slice(0, 3).map((item) => (
                <RecentContent key={item.id} item={item} />
              ))}
              {!overviewQuery.isLoading && recentItems.length === 0 ? (
                <p className="rounded-2xl bg-zinc-50 px-4 py-5 text-sm text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400 md:col-span-3">
                  {t('暂无最近内容变更。', 'No recent content changes yet.')}
                </p>
              ) : null}
            </div>
          </Card>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 xl:col-span-4 xl:gap-8">
          <Card>
            <div className="flex items-start justify-between gap-4">
              <SectionTitle
                subtitle={system?.status === 'online' ? t('系统状态正常', 'System status is normal') : t('存在需要关注的项目', 'Some items need attention')}
                title={t('状态总览', 'Status Overview')}
              />
              <StatusBadge state={statusStateFromSystem(system)} text={system?.health_status?.toUpperCase() ?? t('同步中', 'Syncing')} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <StatusChip label="DB" state={system?.database ? 'ok' : 'warning'} />
              <StatusChip label={t('缓存', 'Cache')} state={system?.cache ? 'ok' : 'warning'} />
              <StatusChip label={t('搜索', 'Search')} state={system?.search_backend ? 'ok' : 'muted'} />
              <StatusChip label={t('分析', 'Analytics')} state={resolvedAnalyticsStatus?.status === 'ready' ? 'ok' : 'muted'} />
            </div>
          </Card>

          <Card className="flex min-h-[360px] flex-col">
            <SectionTitle
              subtitle={t('仅展示真实的最近内容变更', 'Only real recent content changes are shown')}
              title={t('最近动态', 'Recent Activity')}
            />
            <ActivityStream items={recentItems} />
          </Card>

          <Card>
            <SectionTitle
              subtitle={t('由待处理内容、滞留草稿和系统提醒生成', 'Generated from pending content, stale drafts, and system alerts')}
              title={t('待处理事项', 'Pending Work')}
            />
            <div className="mt-4 space-y-2">
              {todoItems.map((item) => (
                <TodoRow item={item} key={item.label} />
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              subtitle={t('数据库、缓存、搜索、任务和分析接入状态', 'Database, cache, search, tasks, and analytics status')}
              title={t('系统状态', 'System Status')}
            />
            <div className="mt-5 space-y-3">
              {statusRows.map((row) => (
                <StatusRowView key={row.label} row={row} />
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              subtitle={t('当前后台记录的最近发布时间', 'Latest publish time recorded by the admin system')}
              title={t('发布校验', 'Publishing Check')}
            />
            <div className="mt-6 grid grid-cols-2 gap-5">
              <PublishingMetric label={t('近7天发布', '7-Day Publishes')} value={formatMetricValue(publishing?.publishes_last_7_days)} />
              <PublishingMetric label={t('滞留草稿', 'Stale Drafts')} value={formatMetricValue(publishing?.stale_drafts)} tone={(publishing?.stale_drafts ?? 0) > 0 ? 'warning' : 'muted'} />
              <div className="col-span-2 border-t border-zinc-100 pt-4 dark:border-white/10">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{t('最近发布时间', 'Latest Publish Time')}</p>
                <p className="mt-1 font-mono text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                  {formatDateTime(publishing?.latest_publish_at, language, t)}
                </p>
              </div>
            </div>
          </Card>
        </aside>
      </main>
    </div>
  )
}

const Card = memo(function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'min-w-0 rounded-3xl border border-black/[0.03] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-shadow duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#15171d] dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] dark:hover:shadow-[0_22px_58px_rgba(0,0,0,0.28)]',
        className,
      )}
    >
      {children}
    </section>
  )
})

function SectionTitle({ subtitle, title, tone = 'light' }: { subtitle?: string; title: string; tone?: 'light' | 'dark' }) {
  return (
    <div>
      <h2 className={cn('text-lg font-bold tracking-tight', tone === 'dark' ? 'text-white' : 'text-zinc-950 dark:text-zinc-100')}>{title}</h2>
      {subtitle ? <p className={cn('mt-1 text-xs font-medium leading-5', tone === 'dark' ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400')}>{subtitle}</p> : null}
    </div>
  )
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200/70 bg-white px-4 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:border-white/[0.08] dark:bg-[#15171d] dark:shadow-[0_16px_36px_rgba(0,0,0,0.22)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-100">{value}</p>
    </div>
  )
}

function HeroStatusCard({ isLoading, metrics, subtitle, title }: { isLoading: boolean; metrics: Metric[]; subtitle: string; title: string }) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-black/[0.03] bg-white p-7 text-zinc-950 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:border-white/[0.08] dark:bg-[#15171d] dark:text-zinc-100 dark:shadow-[0_18px_48px_rgba(0,0,0,0.22)] sm:p-8">
      <div className="relative z-10 mb-10 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-wide">{title}</h2>
          <p className="mt-1 max-w-2xl text-xs font-medium leading-5 text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        {isLoading ? <span className="rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">Syncing</span> : null}
      </div>

      <div className="relative z-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div key={metric.label} className={cn('relative', index > 0 && 'lg:border-l lg:border-zinc-100 dark:lg:border-white/10 lg:pl-6')}>
            <span className={cn('mb-5 block h-1 w-9 rounded-full', accentTokens[metric.accent].line)} />
            <MetricBlock metric={metric} />
          </div>
        ))}
      </div>
    </section>
  )
}

function MetricBlock({ metric }: { metric: Metric }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="mb-1 text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">{metric.value}</span>
      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{metric.label}</span>
      <span className="mt-1 text-[10px] leading-4 text-zinc-500 dark:text-zinc-500">{metric.detail}</span>
    </div>
  )
}

function MiniStatCard({ metric }: { metric: Metric }) {
  return (
    <Card className="flex min-h-[154px] flex-col justify-between p-5">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">{metric.label}</span>
        <span className={cn('h-2.5 w-2.5 rounded-full ring-4', accentTokens[metric.accent].dot, accentTokens[metric.accent].soft)} />
      </div>
      <div>
        <p className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">{metric.value}</p>
        <p className="mt-1 text-xs font-medium text-zinc-400 dark:text-zinc-500">{metric.detail}</p>
        {typeof metric.progress === 'number' ? (
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.08]">
            <div className={cn('h-full rounded-full', accentTokens[metric.accent].fill)} style={{ width: `${clampPercentage(metric.progress)}%` }} />
          </div>
        ) : null}
      </div>
    </Card>
  )
}

function ContentRhythmChart({ labels, published, updates }: { labels: string[]; published: number[]; updates: number[] }) {
  const displayLabels = labels.length > 0 ? labels : ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const normalizedPublished = normalizeSeries(published, displayLabels.length)
  const normalizedUpdates = normalizeSeries(updates, displayLabels.length)
  const publishedHeights = buildHeights(normalizedPublished, 14, 102)
  const updateHeights = buildHeights(normalizedUpdates, 16, 118)
  const maxPublished = Math.max(...normalizedPublished, 0)
  const maxUpdates = Math.max(...normalizedUpdates, 0)

  return (
    <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] p-5 dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,#191b22_0%,#14161c_100%)]">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex gap-2 rounded-full border border-zinc-100 bg-white px-3 py-1.5 text-[10px] font-bold shadow-[0_8px_18px_rgba(15,23,42,0.04)] dark:border-white/[0.08] dark:bg-white/[0.06]">
          <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200"><span className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-zinc-100" />发布</span>
          <span className="flex items-center gap-1.5 text-teal-700"><span className="h-2 w-2 rounded-full bg-teal-600" />更新</span>
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Last 7 Days</span>
      </div>

      <div className="relative h-[180px]">
        <div className="pointer-events-none absolute inset-x-0 top-3 grid h-[132px] grid-rows-4" aria-hidden="true">
          <span className="border-t border-dashed border-zinc-200/70 dark:border-white/[0.08]" />
          <span className="border-t border-dashed border-zinc-200/55 dark:border-white/[0.07]" />
          <span className="border-t border-dashed border-zinc-200/40 dark:border-white/[0.06]" />
          <span className="border-t border-dashed border-zinc-200/30 dark:border-white/[0.05]" />
        </div>
        <div className="relative z-10 grid h-full grid-cols-7 items-end gap-3">
        {displayLabels.map((label, index) => {
          const isPublishedPeak = normalizedPublished[index] === maxPublished && maxPublished > 0
          const isUpdatePeak = normalizedUpdates[index] === maxUpdates && maxUpdates > 0
          return (
            <div key={`${label}-${index}`} className="group grid min-w-0 grid-rows-[1fr_auto] gap-3">
              <div className="flex h-[136px] items-end justify-center gap-1.5 rounded-[1.125rem] bg-zinc-50/70 px-2 py-2 dark:bg-white/[0.035]">
                <span
                  className="w-3 rounded-t-full rounded-b-md bg-teal-500/80 shadow-[0_8px_18px_rgba(13,148,136,0.14)] transition-opacity duration-300 group-hover:opacity-95"
                  style={{
                    height: `${updateHeights[index] ?? 16}px`,
                    opacity: isUpdatePeak ? 1 : 0.55,
                  }}
                />
                <span
                  className="w-3 rounded-t-full rounded-b-md bg-zinc-950 shadow-[0_8px_18px_rgba(24,24,27,0.12)] transition-opacity duration-300 group-hover:opacity-95"
                  style={{
                    height: `${publishedHeights[index] ?? 14}px`,
                    background: isPublishedPeak ? accentTokens.violet.bar : accentTokens.ink.bar,
                  }}
                />
              </div>
              <span className="truncate text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}

function CompositionDonut({ items, total }: { items: CompositionItem[]; total: number }) {
  return (
    <div className="mt-5 flex flex-col items-center">
      <div className="relative h-36 w-36">
        <div
          aria-hidden="true"
          className="h-full w-full rounded-full"
          style={{ background: buildConicGradient(items) }}
        />
        <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] dark:bg-[#15171d] dark:shadow-[inset_0_2px_14px_rgba(0,0,0,0.28)]">
          <span className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">{formatMetricValue(total)}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">内容总量</span>
        </div>
      </div>

      <div className="mt-6 grid w-full grid-cols-1 gap-2">
        {items.map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 text-xs font-semibold">
            <span className="flex min-w-0 items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
              <span className={cn('h-1.5 w-1.5 rounded-full', accentTokens[item.accent].dot)} />
              <span className="truncate">{item.label}</span>
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">{item.published}/{item.total}</span>
            <span className={cn('min-w-9 text-right', accentTokens[item.accent].text)}>{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function AnalyticsOverviewPanel({
  overview,
  preview,
  referrers,
  status,
  trends,
}: {
  overview?: DashboardAnalyticsOverview
  preview: boolean
  referrers: DashboardAnalyticsReferrer[]
  status?: DashboardAnalyticsStatus
  trends?: DashboardAnalyticsTrends
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          subtitle={preview ? '本地预览：模拟 Umami 接入后的访问数据展示' : `来自 ${status?.provider ?? 'Analytics'} 的真实访问数据`}
          title="访问分析"
        />
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[10px] font-bold uppercase text-teal-700 dark:bg-teal-400/10 dark:text-teal-300">
            {status?.provider ?? 'umami'}
          </span>
          <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">
            {overview?.period_label ?? 'Last 30 Days'}
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AnalyticsMetricCard label="浏览量" value={formatMetricValue(overview?.pageviews)} />
        <AnalyticsMetricCard label="访客数" value={formatMetricValue(overview?.visitors)} tone="teal" />
        <AnalyticsMetricCard label="访问次数" value={formatMetricValue(overview?.visits)} tone="violet" />
        <AnalyticsMetricCard label="跳出率" value={formatNullablePercentage(overview?.bounce_rate)} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(220px,0.65fr)]">
        <AnalyticsTrendChart trends={trends} />
        <AnalyticsReferrerList referrers={referrers} />
      </div>
    </Card>
  )
}

function AnalyticsMetricCard({ label, tone = 'ink', value }: { label: string; tone?: Accent; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-4 dark:border-white/[0.06] dark:bg-white/[0.04]">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{label}</span>
        <span className={cn('h-2 w-2 rounded-full', accentTokens[tone].dot)} />
      </div>
      <p className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">{value}</p>
    </div>
  )
}

function AnalyticsTrendChart({ trends }: { trends?: DashboardAnalyticsTrends }) {
  const labels = trends?.labels ?? []
  const pageviews = normalizeSeries(trends?.pageviews ?? [], labels.length)
  const visitors = normalizeSeries(trends?.visitors ?? [], labels.length)
  const displayLabels = labels.length > 0 ? labels : ['-', '-', '-', '-', '-', '-', '-']
  const displayPageviews = pageviews.length > 0 ? pageviews : Array.from({ length: displayLabels.length }, () => 0)
  const displayVisitors = visitors.length > 0 ? visitors : Array.from({ length: displayLabels.length }, () => 0)
  const maxValue = Math.max(...displayPageviews, ...displayVisitors, 1)
  const yTicks = buildAnalyticsTicks(maxValue)
  const pageviewLine = buildLineChartPath(displayPageviews, maxValue)
  const visitorLine = buildLineChartPath(displayVisitors, maxValue)

  return (
    <div className="rounded-[1.5rem] border border-zinc-100 bg-[linear-gradient(180deg,#fff_0%,#fbfbfc_100%)] p-5 dark:border-white/[0.08] dark:bg-[linear-gradient(180deg,#191b22_0%,#14161c_100%)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">访问趋势</h3>
          <p className="mt-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{trends?.period_label ?? 'Last 14 Days'} · 横轴按天统计，纵轴为访问量</p>
        </div>
        <div className="flex gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300"><span className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-zinc-100" />PV</span>
          <span className="flex items-center gap-1.5 text-teal-700 dark:text-teal-300"><span className="h-2 w-2 rounded-full bg-teal-500" />UV</span>
        </div>
      </div>

      <div className="grid grid-cols-[3.25rem_1fr] grid-rows-[180px_auto] gap-x-3 gap-y-3">
        <div className="relative h-[180px]">
          {yTicks.map((tick, index) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[10px] font-semibold tabular-nums text-zinc-400 dark:text-zinc-500"
              style={{ top: `${index === yTicks.length - 1 ? 8 : 100 - (tick / yTicks[yTicks.length - 1]) * 88}%` }}
            >
              {formatCompactNumber(tick)}
            </span>
          ))}
        </div>

        <div className="relative h-[180px] overflow-hidden rounded-2xl bg-zinc-50/70 px-3 py-4 dark:bg-white/[0.035]">
          <svg aria-label="访问趋势折线图" className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            {yTicks.map((tick) => {
              const y = 92 - (tick / yTicks[yTicks.length - 1]) * 84
              return <line key={tick} stroke="currentColor" strokeDasharray="4 4" strokeWidth="0.7" x1="0" x2="100" y1={y} y2={y} className="text-zinc-200 dark:text-white/10" />
            })}
            <path d={pageviewLine.area} fill="url(#analyticsPageviewsArea)" opacity="0.14" />
            <path d={pageviewLine.path} fill="none" stroke="var(--dashboard-ink)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
            <path d={visitorLine.path} fill="none" stroke="var(--dashboard-teal)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
            {pageviewLine.points.map((point, index) => (
              <circle key={`pv-${index}`} cx={point.x} cy={point.y} fill="var(--dashboard-ink)" r="1.8" />
            ))}
            {visitorLine.points.map((point, index) => (
              <circle key={`uv-${index}`} cx={point.x} cy={point.y} fill="var(--dashboard-teal)" r="1.8" />
            ))}
            <defs>
              <linearGradient id="analyticsPageviewsArea" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--dashboard-ink)" />
                <stop offset="100%" stopColor="var(--dashboard-ink)" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <span className="text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">访问量</span>
        <div className="grid min-w-0" style={{ gridTemplateColumns: `repeat(${displayLabels.length}, minmax(0, 1fr))` }}>
          {displayLabels.map((label, index) => (
            <span key={`${label}-${index}`} className={cn('truncate text-center text-[9px] font-bold text-zinc-400 dark:text-zinc-500', index % 2 === 1 && displayLabels.length > 9 ? 'hidden sm:block' : '')}>
              {label}
            </span>
          ))}
          <span className="col-span-full mt-1 text-center text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">日期 / 天</span>
        </div>
      </div>
    </div>
  )
}

function AnalyticsReferrerList({ referrers }: { referrers: DashboardAnalyticsReferrer[] }) {
  return (
    <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50/70 p-5 dark:border-white/[0.08] dark:bg-white/[0.04]">
      <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">来源排行</h3>
      <div className="mt-5 space-y-3">
        {referrers.length > 0 ? referrers.slice(0, 5).map((item) => (
          <div key={item.label} className="grid grid-cols-[1fr_auto] gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-200">{item.label}</p>
              <p className="mt-0.5 text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{formatMetricValue(item.visits)} visits</p>
            </div>
            <span className="text-xs font-bold text-zinc-950 dark:text-zinc-100">{formatMetricValue(item.pageviews)}</span>
          </div>
        )) : (
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500">暂无来源数据</p>
        )}
      </div>
    </div>
  )
}

function RecentContent({ item }: { item: DashboardActivityItem }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-white/[0.04]">
      <p className="truncate text-sm font-bold text-zinc-950 dark:text-zinc-100">{item.title}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">{formatActivityTypeLabel(item.type)}</span>
        <span className="shrink-0 text-xs font-semibold text-zinc-400 dark:text-zinc-500">{formatShortTime(item.time)}</span>
      </div>
    </article>
  )
}

function StatusBadge({ state, text }: { state: StatusState; text: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase', statusTokens[state].soft, statusTokens[state].text)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', statusTokens[state].dot)} />
      {text}
    </span>
  )
}

function StatusChip({ label, state }: { label: string; state: StatusState }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-2xl px-3 py-2', statusTokens[state].soft)}>
      <span className={cn('h-2 w-2 rounded-full', statusTokens[state].dot)} />
      <span className={cn('truncate text-xs font-bold', statusTokens[state].text)}>{label}</span>
    </div>
  )
}

function ActivityStream({ items }: { items: DashboardActivityItem[] }) {
  if (items.length === 0) {
    return <p className="mt-6 rounded-2xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-white/[0.04] dark:text-zinc-400">暂无最近动态。</p>
  }

  return (
    <div className="relative mt-6 flex-1 pl-4">
      <div className="absolute bottom-4 left-[19px] top-2 w-px bg-zinc-200 dark:bg-white/10" />
      <div className="space-y-6">
        {items.slice(0, 5).map((item, index) => (
          <div key={item.id} className="relative pl-6">
            <div className={cn('absolute left-[-2px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white dark:ring-[#15171d]', index === 0 ? 'bg-teal-600 dark:bg-teal-400' : 'bg-zinc-400 dark:bg-zinc-500')} />
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h3>
                <p className="mt-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-500">{formatActivityTypeLabel(item.type)} · {formatShortTime(item.time)}</p>
              </div>
              <span className="shrink-0 text-[10px] font-bold text-zinc-400 dark:text-zinc-500">{formatShortDate(item.time)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TodoRow({ item }: { item: TodoItem }) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-zinc-100 bg-[#f8f8f9] p-3 dark:border-white/[0.06] dark:bg-white/[0.04]">
      <span className={cn('h-2 w-2 rounded-full', statusTokens[item.state].dot)} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{item.label}</p>
        <p className="mt-0.5 truncate text-[11px] font-medium text-zinc-400 dark:text-zinc-500">{item.detail}</p>
      </div>
      <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', statusTokens[item.state].soft, statusTokens[item.state].text)}>
        {item.count}
      </span>
    </div>
  )
}

function StatusRowView({ row }: { row: StatusRow }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-white/[0.04]">
      <div className="min-w-0">
        <p className="text-xs font-bold text-zinc-500 dark:text-zinc-300">{row.label}</p>
        {row.detail ? <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">{row.detail}</p> : null}
      </div>
      <span className={cn('inline-flex shrink-0 items-center gap-2 rounded-full px-2.5 py-1 text-[10px] font-bold', statusTokens[row.state].soft, statusTokens[row.state].text)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', statusTokens[row.state].dot)} />
        {row.value}
      </span>
    </div>
  )
}

function PublishingMetric({ label, tone = 'muted', value }: { label: string; tone?: 'muted' | 'warning'; value: string }) {
  return (
    <div>
      <p className={cn('text-3xl font-bold tracking-tight', tone === 'warning' ? 'text-amber-600 dark:text-amber-300' : 'text-zinc-950 dark:text-zinc-100')}>{value}</p>
      <p className="mt-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  )
}

function buildContentBreakdownItems(contentBreakdown?: DashboardContentBreakdown) {
  const fallback: DashboardContentBreakdownItem = { total: 0, draft: 0, published: 0 }

  return [
    { accent: 'ink', key: 'posts', label: '文章', value: contentBreakdown?.posts ?? fallback },
    { accent: 'violet', key: 'notes', label: '笔记', value: contentBreakdown?.notes ?? fallback },
    { accent: 'teal', key: 'projects', label: '项目', value: contentBreakdown?.projects ?? fallback },
    { accent: 'amber', key: 'photos', label: '图库', value: contentBreakdown?.photos ?? fallback },
    { accent: 'rose', key: 'podcasts', label: '播客', value: contentBreakdown?.podcasts ?? fallback },
  ] as const
}

function buildComposition(items: ReturnType<typeof buildContentBreakdownItems>): CompositionItem[] {
  const total = Math.max(items.reduce((sum, item) => sum + item.value.total, 0), 1)

  return items.map((item) => ({
    accent: item.accent,
    draft: item.value.draft,
    label: item.label,
    percent: Math.round((item.value.total / total) * 100),
    published: item.value.published,
    total: item.value.total,
  }))
}

function buildConicGradient(items: CompositionItem[]) {
  const activeItems = items.filter((item) => item.total > 0)
  if (activeItems.length === 0) {
    return 'conic-gradient(#e4e4e7 0% 100%)'
  }

  let cursor = 0
  const segments = activeItems.map((item, index) => {
    const start = cursor
    const end = index === activeItems.length - 1 ? 100 : Math.min(100, cursor + Math.max(item.percent, 1))
    cursor = end
    return `${accentTokens[item.accent].bar} ${start}% ${end}%`
  })

  return `conic-gradient(${segments.join(', ')})`
}

function buildTodoItems(
  summary: DashboardSummary | undefined,
  publishing: DashboardPublishingSnapshot | undefined,
  t: (zh: string, en: string) => string,
): TodoItem[] {
  const pendingContent = summary?.pending_content ?? 0
  const staleDrafts = publishing?.stale_drafts ?? 0
  const systemAlerts = summary?.system_alerts ?? 0

  return [
    {
      count: formatMetricValue(pendingContent),
      detail: t('待审核或待处理的内容', 'Content waiting for review or handling'),
      label: t('待处理内容', 'Pending Content'),
      state: pendingContent > 0 ? 'warning' : 'ok',
    },
    {
      count: formatMetricValue(staleDrafts),
      detail: t('后台记录的滞留草稿', 'Stale drafts recorded by the admin system'),
      label: t('滞留草稿', 'Stale Drafts'),
      state: staleDrafts > 0 ? 'warning' : 'ok',
    },
    {
      count: formatMetricValue(systemAlerts),
      detail: t('需要关注的系统提醒', 'System alerts needing attention'),
      label: t('系统提醒', 'System Alerts'),
      state: systemAlerts > 0 ? 'error' : 'ok',
    },
  ]
}

function buildStatusRows(
  system: DashboardSystemOverview | undefined,
  analyticsStatus: DashboardAnalyticsStatus | undefined,
  t: (zh: string, en: string) => string,
): StatusRow[] {
  const taskCount = system?.task_count ?? 0
  const pendingTasks = system?.pending_task_count ?? 0

  return [
    {
      label: t('数据库', 'Database'),
      state: system?.database ? 'ok' : 'warning',
      value: system?.database ? t('正常', 'OK') : t('待检查', 'Check'),
    },
    {
      label: t('缓存', 'Cache'),
      state: system?.cache ? 'ok' : 'warning',
      value: system?.cache ? t('启用', 'Enabled') : t('待检查', 'Check'),
    },
    {
      detail: system?.search_backend ?? undefined,
      label: t('搜索后端', 'Search Backend'),
      state: system?.search_backend ? 'ok' : 'muted',
      value: system?.search_backend ? t('可用', 'Ready') : t('未配置', 'Missing'),
    },
    {
      detail: `${formatMetricValue(pendingTasks)} / ${formatMetricValue(taskCount)}`,
      label: t('后台任务', 'Background Tasks'),
      state: pendingTasks > 0 ? 'warning' : 'ok',
      value: pendingTasks > 0 ? t('待处理', 'Pending') : t('清爽', 'Clear'),
    },
    {
      detail: analyticsStatus?.message,
      label: t('分析接入', 'Analytics'),
      state: analyticsStatus?.status === 'ready' ? 'ok' : analyticsStatus?.status === 'partial' ? 'warning' : 'muted',
      value: analyticsStatus?.status === 'ready' ? t('已配置', 'Ready') : t('未配置', 'Missing'),
    },
  ]
}

function buildAnalyticsPreviewData(t: (zh: string, en: string) => string): {
  overview: DashboardAnalyticsOverview
  referrers: DashboardAnalyticsReferrer[]
  status: DashboardAnalyticsStatus
  trends: DashboardAnalyticsTrends
} {
  return {
    status: {
      status: 'ready',
      provider: 'umami',
      site: 'local-preview',
      dashboard_url: null,
      base_url: 'https://api.umami.is/v1',
      missing: [],
      collection_enabled: true,
      data_state: 'available',
      last_error: null,
      last_synced_at: '2026-05-23 21:40',
      message: t('Umami 预览数据已加载。', 'Umami preview data is loaded.'),
    },
    overview: {
      period_label: t('最近30天', 'Last 30 Days'),
      pageviews: 18432,
      visitors: 6914,
      visits: 9821,
      bounce_rate: 37.8,
      avg_visit_duration: 214,
    },
    referrers: [
      { label: 'google.com', visitors: 2418, visits: 3250, pageviews: 5024 },
      { label: 'github.com', visitors: 1284, visits: 1620, pageviews: 2451 },
      { label: 'x.com', visitors: 508, visits: 612, pageviews: 899 },
      { label: 'Direct / None', visitors: 731, visits: 1470, pageviews: 2942 },
      { label: 'bing.com', visitors: 386, visits: 498, pageviews: 744 },
    ],
    trends: {
      period_label: t('最近14天', 'Last 14 Days'),
      labels: ['05.10', '05.11', '05.12', '05.13', '05.14', '05.15', '05.16', '05.17', '05.18', '05.19', '05.20', '05.21', '05.22', '05.23'],
      pageviews: [812, 904, 956, 1012, 988, 1108, 1214, 1290, 1186, 1320, 1406, 1498, 1532, 1606],
      visitors: [322, 360, 384, 406, 398, 438, 472, 501, 476, 522, 548, 580, 592, 621],
      visits: [408, 455, 489, 510, 498, 552, 588, 615, 604, 642, 674, 708, 722, 761],
    },
  }
}

function buildHeights(values: number[], minHeight = 24, maxHeight = 118) {
  if (values.length === 0) {
    return []
  }

  const maxValue = Math.max(...values, 1)
  return values.map((value) => minHeight + Math.round((value / maxValue) * (maxHeight - minHeight)))
}

function buildLineChartPath(values: number[], maxValue: number) {
  const pointCount = Math.max(values.length, 1)
  const points = values.map((value, index) => ({
    x: pointCount === 1 ? 50 : (index / (pointCount - 1)) * 100,
    y: 92 - (value / Math.max(maxValue, 1)) * 84,
  }))
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(' ')
  const area = points.length > 0
    ? `${path} L${points[points.length - 1].x.toFixed(2)},100 L${points[0].x.toFixed(2)},100 Z`
    : ''

  return { area, path, points }
}

function buildAnalyticsTicks(maxValue: number) {
  const safeMax = Math.max(maxValue, 1)
  const top = Math.ceil(safeMax / 500) * 500 || safeMax
  return [0, Math.round(top * 0.33), Math.round(top * 0.66), top]
}

function normalizeSeries(values: number[], expectedCount: number) {
  if (expectedCount <= 0) {
    return []
  }

  if (values.length >= expectedCount) {
    return values.slice(0, expectedCount)
  }

  return [...values, ...Array.from({ length: expectedCount - values.length }, () => 0)]
}

function normalizeProgress(value: number | undefined, max: number) {
  if (!Number.isFinite(value ?? Number.NaN) || max <= 0) {
    return 0
  }

  return Math.round(((value ?? 0) / max) * 100)
}

function clampPercentage(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.min(100, Math.max(0, Math.round(value)))
}

function formatNullablePercentage(value?: number | null) {
  if (value === null || value === undefined) {
    return '-'
  }
  return `${value.toFixed(1)}%`
}

function statusStateFromSystem(system: DashboardSystemOverview | undefined): StatusState {
  if (!system) return 'muted'
  if (system.health_status === 'error') return 'error'
  if (system.status === 'attention' || system.health_status === 'degraded') return 'warning'
  return 'ok'
}

function systemStatusText(system: DashboardSystemOverview | undefined, t: (zh: string, en: string) => string) {
  if (!system) return t('系统状态同步中', 'System status is syncing')
  if (system.health_status === 'error') return t('系统存在错误', 'System has errors')
  if (system.status === 'attention' || system.health_status === 'degraded') return t('系统需要关注', 'System needs attention')
  return t('系统状态正常', 'System status is normal')
}

function formatActivityTypeLabel(value: DashboardActivityItem['type']) {
  if (value === 'post') return '文章'
  if (value === 'note') return '笔记'
  if (value === 'project') return '项目'
  if (value === 'photo') return '图片'
  return '播客'
}

function formatShortTime(value: string) {
  const match = value.match(/(\d{2}:\d{2})/)
  return match?.[1] ?? value
}

function formatShortDate(value: string) {
  const match = value.match(/(\d{2})-(\d{2})/)
  return match ? `${match[1]}.${match[2]}` : value
}

function formatDateTime(value: string | null | undefined, language: 'zh' | 'en', t: (zh: string, en: string) => string) {
  if (!value) {
    return t('暂无记录', 'No Record')
  }

  const dateTime = value.replace(/-/g, '.')
  return language === 'zh' ? dateTime : value
}

function formatMetricValue(value?: number | null) {
  if (value === null || value === undefined) {
    return '-'
  }
  return value.toLocaleString()
}

function formatCompactNumber(value: number) {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`
  }
  return value.toString()
}
