import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/api'
import type {
  SystemCacheSummary,
  SystemHealth,
  SystemPerformanceSummary,
  SystemSearchStatus,
  SystemSearchTestResult,
  SystemTaskItem,
} from '@/features/system/types/system'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getSystemHealth(): Promise<SystemHealth> {
  if (enableMock) {
    const { getMockSystemHealth } = await import('@/features/system/services/system-mock')
    return getMockSystemHealth()
  }
  const response = await getJson<SystemHealth>('/system/health/')
  if (!response.success) throw response
  return response.data
}

export async function getSystemPerformanceSummary(): Promise<SystemPerformanceSummary> {
  if (enableMock) {
    const { getMockSystemPerformanceSummary } = await import('@/features/system/services/system-mock')
    return getMockSystemPerformanceSummary()
  }
  const response = await getJson<SystemPerformanceSummary>('/system/performance/')
  if (!response.success) throw response
  return response.data
}

export async function getSystemTasks(): Promise<SystemTaskItem[]> {
  if (enableMock) {
    const { getMockSystemTasks } = await import('@/features/system/services/system-mock')
    return getMockSystemTasks()
  }
  const response = await getJson<SystemTaskItem[]>('/system/tasks/')
  if (!response.success) throw response
  return response.data
}

export async function retrySystemTask(id: string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { retryMockSystemTask } = await import('@/features/system/services/system-mock')
    return retryMockSystemTask(id)
  }
  return resolveMutation(getJson<unknown>(`/system/tasks/${id}/retry/`, { method: 'POST', body: JSON.stringify({}) }))
}

export async function getSystemCacheSummary(): Promise<SystemCacheSummary> {
  if (enableMock) {
    const { getMockSystemCacheSummary } = await import('@/features/system/services/system-mock')
    return getMockSystemCacheSummary()
  }
  const response = await getJson<SystemCacheSummary>('/system/cache/')
  if (!response.success) throw response
  return response.data
}

export async function invalidateSystemCache(payload: { scope: string }): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { invalidateMockSystemCache } = await import('@/features/system/services/system-mock')
    return invalidateMockSystemCache(payload)
  }
  return resolveMutation(getJson<unknown>('/system/cache/invalidate/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function getSystemSearchStatus(): Promise<SystemSearchStatus> {
  if (enableMock) {
    const { getMockSystemSearchStatus } = await import('@/features/system/services/system-mock')
    return getMockSystemSearchStatus()
  }
  const response = await getJson<SystemSearchStatus>('/system/search/status/')
  if (!response.success) throw response
  return response.data
}

export async function testSystemSearch(query: string): Promise<SystemSearchTestResult> {
  if (enableMock) {
    const { testMockSystemSearch } = await import('@/features/system/services/system-mock')
    return testMockSystemSearch(query)
  }
  const response = await getJson<SystemSearchTestResult>(`/system/search/test/?q=${encodeURIComponent(query)}`)
  if (!response.success) throw response
  return response.data
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

