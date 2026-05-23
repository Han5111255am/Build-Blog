import type { ApiSuccessResponse } from '@/types/api'
import type {
  SystemCacheSummary,
  SystemHealth,
  SystemPerformanceSummary,
  SystemSearchStatus,
  SystemSearchTestResult,
  SystemTaskItem,
} from '@/features/system/types/system'

const mockHealth: SystemHealth = {
  status: 'ok',
  database: true,
  cache: true,
  search_backend: 'meilisearch',
  broker_configured: true,
  result_backend_configured: false,
}

const mockTasks: SystemTaskItem[] = [
  {
    id: 'system-health-check',
    name: 'system.health_check',
    category: 'system',
    status: 'success',
    updated_at: '2026-03-12 10:20',
    message: 'Database and cache are healthy.',
    retryable: false,
    action_label: null,
    metrics: [
      { label: 'health_status', value: 'ok' },
      { label: 'database', value: 'ok' },
      { label: 'cache', value: 'ok' },
    ],
    details: ['Database connectivity: ok', 'Cache connectivity: ok', 'Search backend: meilisearch'],
    events: [
      { id: 'system-health-1', time: '2026-03-12 10:20', level: 'info', source: 'system', message: 'Database and cache are healthy.' },
      { id: 'system-health-2', time: '2026-03-12 10:20', level: 'info', source: 'system', message: 'Search backend: meilisearch' },
    ],
  },
  {
    id: 'celery-worker-connectivity',
    name: 'celery.worker_connectivity',
    category: 'celery',
    status: 'failed',
    updated_at: '2026-03-12 10:40',
    message: 'No Celery workers responded within the timeout window.',
    retryable: true,
    action_label: 'Recheck',
    metrics: [
      { label: 'workers', value: 0 },
      { label: 'active', value: 0 },
      { label: 'queued', value: 2 },
    ],
    details: ['No worker heartbeat received.', 'Broker is configured but workers are offline.'],
    events: [
      { id: 'celery-1', time: '2026-03-12 10:40', level: 'error', source: 'celery', message: 'No Celery workers responded within the timeout window.' },
      { id: 'celery-2', time: '2026-03-12 10:39', level: 'warning', source: 'celery', message: 'Broker is configured but workers are offline.' },
    ],
  },
  {
    id: 'content-review-queue',
    name: 'content.review_queue',
    category: 'content',
    status: 'pending',
    updated_at: '2026-03-12 09:58',
    message: '5 draft items are waiting for review.',
    retryable: false,
    action_label: null,
    metrics: [
      { label: 'posts', value: 2 },
      { label: 'notes', value: 1 },
      { label: 'projects', value: 2 },
      { label: 'total', value: 5 },
    ],
    details: ['Post drafts: 2', 'Note drafts: 1', 'Project drafts: 2'],
    events: [
      { id: 'content-1', time: '2026-03-12 09:58', level: 'warning', source: 'content', message: '5 draft items are waiting for review.' },
      { id: 'content-2', time: '2026-03-12 09:58', level: 'info', source: 'content', message: 'Project drafts: 2' },
    ],
  },
]

const mockCache: SystemCacheSummary = {
  keys: 124,
  memory_mb: 86,
  hit_rate: 0.82,
  updated_at: '2026-03-07 10:42',
}

const mockSearch: SystemSearchStatus = {
  backend: 'meilisearch',
  healthy: true,
  indexed_documents: 2456,
  updated_at: '2026-03-07 10:41',
}

const mockPerformance: SystemPerformanceSummary = {
  enabled: true,
  slow_threshold_ms: 400,
  window_started_at: '2026-03-16T10:00:00+08:00',
  window_updated_at: '2026-03-16T10:08:00+08:00',
  total_requests: 284,
  slow_requests: 12,
  avg_duration_ms: 84.6,
  max_duration_ms: 512.4,
  top_routes: [
    {
      route: 'api/admin/dashboard/',
      path: '/api/admin/dashboard/',
      method: 'GET',
      category: 'admin',
      count: 18,
      slow_requests: 4,
      avg_duration_ms: 186.4,
      max_duration_ms: 512.4,
      last_duration_ms: 164.2,
      last_status_code: 200,
      last_seen_at: '2026-03-16T10:08:00+08:00',
    },
    {
      route: 'api/admin/system/performance/',
      path: '/api/admin/system/performance/',
      method: 'GET',
      category: 'admin',
      count: 9,
      slow_requests: 0,
      avg_duration_ms: 42.1,
      max_duration_ms: 61.7,
      last_duration_ms: 39.6,
      last_status_code: 200,
      last_seen_at: '2026-03-16T10:07:15+08:00',
    },
  ],
}

export async function getMockSystemHealth(): Promise<SystemHealth> {
  await delay(120)
  return mockHealth
}

export async function getMockSystemPerformanceSummary(): Promise<SystemPerformanceSummary> {
  await delay(140)
  return mockPerformance
}

export async function getMockSystemTasks(): Promise<SystemTaskItem[]> {
  await delay(150)
  return mockTasks
}

export async function retryMockSystemTask(id: string): Promise<ApiSuccessResponse<unknown>> {
  await delay(160)
  const task = mockTasks.find((item) => item.id === id)
  if (task) {
    task.status = 'running'
    task.updated_at = new Date().toISOString().slice(0, 16).replace('T', ' ')
    task.message = 'Retry request was accepted and the task will be probed again.'
    task.events = [
      {
        id: `retry-${Date.now()}`,
        time: new Date().toISOString().slice(0, 16).replace('T', ' '),
        level: 'info' as const,
        source: 'system',
        message: 'Retry request accepted.',
      },
      ...task.events,
    ].slice(0, 12)
  }
  return { success: true, message: 'Retry request accepted.', data: {} }
}

export async function getMockSystemCacheSummary(): Promise<SystemCacheSummary> {
  await delay(150)
  return mockCache
}

export async function invalidateMockSystemCache(payload: { scope: string }): Promise<ApiSuccessResponse<unknown>> {
  await delay(200)
  mockCache.updated_at = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return { success: true, message: `Cache invalidated for scope ${payload.scope}.`, data: {} }
}

export async function getMockSystemSearchStatus(): Promise<SystemSearchStatus> {
  await delay(150)
  return mockSearch
}

export async function testMockSystemSearch(query: string): Promise<SystemSearchTestResult> {
  await delay(220)
  const base = [
    { id: 'p-1', type: 'post', title: `Post match: ${query}`, score: 0.92 },
    { id: 'n-1', type: 'note', title: `Note match: ${query}`, score: 0.84 },
  ] as const

  return {
    query,
    took_ms: 18,
    results: query.trim() ? [...base] : [],
  }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
