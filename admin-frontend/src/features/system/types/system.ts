export interface SystemHealth {
  status: 'ok' | 'degraded' | 'error'
  database: boolean
  cache: boolean
  search_backend: string
  broker_configured: boolean
  result_backend_configured: boolean
}

export interface SystemTaskItem {
  id: string
  name: string
  category: 'system' | 'celery' | 'content' | 'search'
  status: 'pending' | 'running' | 'success' | 'failed'
  updated_at: string
  message?: string
  retryable: boolean
  action_label?: string | null
  metrics: SystemTaskMetric[]
  details: string[]
  events: SystemTaskEvent[]
}

export interface SystemTaskMetric {
  label: string
  value: string | number
}

export interface SystemTaskEvent {
  id: string
  time: string | null
  level: 'info' | 'warning' | 'error'
  source: string
  message: string
}

export interface SystemCacheSummary {
  keys: number
  memory_mb: number
  hit_rate: number
  updated_at: string
}

export interface SystemSearchStatus {
  backend: string
  healthy: boolean
  indexed_documents: number
  updated_at: string
}

export interface SystemSearchTestResultItem {
  id: string
  type: 'post' | 'note' | 'project' | 'photo' | 'podcast'
  title: string
  score: number
}

export interface SystemSearchTestResult {
  query: string
  took_ms: number
  results: SystemSearchTestResultItem[]
}

export interface SystemPerformanceRouteSummary {
  route: string
  path: string
  method: string
  category: 'admin' | 'public' | 'other'
  count: number
  slow_requests: number
  avg_duration_ms: number
  max_duration_ms: number
  last_duration_ms: number
  last_status_code: number
  last_seen_at: string
}

export interface SystemPerformanceSummary {
  enabled: boolean
  slow_threshold_ms: number
  window_started_at: string
  window_updated_at: string
  total_requests: number
  slow_requests: number
  avg_duration_ms: number
  max_duration_ms: number
  top_routes: SystemPerformanceRouteSummary[]
}
