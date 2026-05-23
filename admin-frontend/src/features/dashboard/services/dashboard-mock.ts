import type { DashboardOverview } from '@/features/dashboard/types/dashboard'

const mockDashboardOverview: DashboardOverview = {
  summary: {
    pending_content: 8,
    published_content: 24,
    assets: 112,
    system_alerts: 0,
  },
  system_overview: {
    status: 'online',
    health_status: 'ok',
    database: true,
    cache: true,
    search_backend: 'database',
    task_count: 4,
    pending_task_count: 1,
    completion_rate: 75,
  },
  trends: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    content_updates: [4, 6, 5, 8, 3, 7, 9],
    published_content: [1, 2, 1, 4, 2, 3, 5],
  },
  content_breakdown: {
    posts: { total: 14, draft: 3, published: 11 },
    notes: { total: 9, draft: 2, published: 7 },
    projects: { total: 4, draft: 1, published: 3 },
    photos: { total: 18, draft: 0, published: 18 },
    podcasts: { total: 5, draft: 1, published: 4 },
  },
  publishing_snapshot: {
    updates_last_7_days: 42,
    publishes_last_7_days: 18,
    stale_drafts: 3,
    latest_publish_at: '2026-03-12 11:40',
    latest_update_at: '2026-03-12 15:15',
  },
  analytics_status: {
    status: 'ready',
    provider: 'plausible',
    site: 'admin.example.com',
    dashboard_url: 'https://analytics.example.com/share/admin',
    base_url: 'https://plausible.io',
    missing: [],
    collection_enabled: true,
    data_state: 'available',
    last_error: null,
    last_synced_at: '2026-03-12 16:20',
    message: 'Analytics provider is configured and traffic data was synced successfully.',
  },
  analytics_overview: {
    period_label: 'Last 30 Days',
    pageviews: 18432,
    visitors: 6914,
    visits: 9821,
    bounce_rate: 37.8,
    avg_visit_duration: 214,
  },
  analytics_referrers: [
    { label: 'google.com', visitors: 2418, visits: 3250, pageviews: 5024 },
    { label: 'github.com', visitors: 1284, visits: 1620, pageviews: 2451 },
    { label: 'news.ycombinator.com', visitors: 944, visits: 1102, pageviews: 1633 },
    { label: 'Direct / None', visitors: 731, visits: 1470, pageviews: 2942 },
    { label: 'x.com', visitors: 508, visits: 612, pageviews: 899 },
  ],
  analytics_trends: {
    period_label: 'Last 14 Days',
    labels: ['03-01', '03-02', '03-03', '03-04', '03-05', '03-06', '03-07', '03-08', '03-09', '03-10', '03-11', '03-12', '03-13', '03-14'],
    pageviews: [812, 904, 956, 1012, 988, 1108, 1214, 1290, 1186, 1320, 1406, 1498, 1532, 1606],
    visitors: [322, 360, 384, 406, 398, 438, 472, 501, 476, 522, 548, 580, 592, 621],
    visits: [408, 455, 489, 510, 498, 552, 588, 615, 604, 642, 674, 708, 722, 761],
  },
  recent_activity: [
    { id: 'post-1', type: 'post', title: 'Homepage refresh', time: '2026-03-12 10:20' },
    { id: 'note-1', type: 'note', title: 'Ops note updated', time: '2026-03-12 09:55' },
    { id: 'project-1', type: 'project', title: 'Project metadata synced', time: '2026-03-12 09:10' },
  ],
}

export async function getMockDashboardOverview(): Promise<DashboardOverview> {
  await new Promise((resolve) => window.setTimeout(resolve, 120))
  return mockDashboardOverview
}
