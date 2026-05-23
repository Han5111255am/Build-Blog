export interface DashboardSummary {
  pending_content: number
  published_content: number
  assets: number
  system_alerts: number
}

export interface DashboardSystemOverview {
  status: 'online' | 'attention'
  health_status: 'ok' | 'degraded' | 'error'
  database: boolean
  cache: boolean
  search_backend: string
  task_count: number
  pending_task_count: number
  completion_rate: number
}

export interface DashboardTrends {
  labels: string[]
  content_updates: number[]
  published_content: number[]
}

export interface DashboardActivityItem {
  id: string
  type: 'post' | 'note' | 'project' | 'photo' | 'podcast'
  title: string
  time: string
}

export interface DashboardContentBreakdownItem {
  total: number
  draft: number
  published: number
}

export interface DashboardContentBreakdown {
  posts: DashboardContentBreakdownItem
  notes: DashboardContentBreakdownItem
  projects: DashboardContentBreakdownItem
  photos: DashboardContentBreakdownItem
  podcasts: DashboardContentBreakdownItem
}

export interface DashboardPublishingSnapshot {
  updates_last_7_days: number
  publishes_last_7_days: number
  stale_drafts: number
  latest_publish_at: string | null
  latest_update_at: string | null
}

export interface DashboardAnalyticsOverview {
  period_label: string
  pageviews: number | null
  visitors: number | null
  visits: number | null
  bounce_rate: number | null
  avg_visit_duration: number | null
}

export interface DashboardAnalyticsReferrer {
  label: string
  visitors: number | null
  visits: number | null
  pageviews: number | null
}

export interface DashboardAnalyticsTrends {
  period_label: string
  labels: string[]
  pageviews: number[]
  visitors: number[]
  visits: number[]
}

export interface DashboardAnalyticsStatus {
  status: 'ready' | 'partial' | 'unconfigured' | 'unsupported'
  provider: string | null
  site: string | null
  dashboard_url: string | null
  base_url: string | null
  missing: string[]
  collection_enabled: boolean
  data_state: 'syncing' | 'available' | 'error' | 'unavailable'
  last_error: string | null
  last_synced_at: string | null
  message: string
}

export interface DashboardOverview {
  summary: DashboardSummary
  system_overview: DashboardSystemOverview
  trends: DashboardTrends
  content_breakdown: DashboardContentBreakdown
  publishing_snapshot: DashboardPublishingSnapshot
  analytics_status: DashboardAnalyticsStatus
  analytics_overview: DashboardAnalyticsOverview
  analytics_referrers: DashboardAnalyticsReferrer[]
  analytics_trends: DashboardAnalyticsTrends
  recent_activity: DashboardActivityItem[]
}
