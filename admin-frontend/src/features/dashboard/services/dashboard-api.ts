import { getJson } from '@/services/http/get-json'
import type { DashboardOverview } from '@/features/dashboard/types/dashboard'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getDashboardOverview(): Promise<DashboardOverview> {
  if (enableMock) {
    const { getMockDashboardOverview } = await import('@/features/dashboard/services/dashboard-mock')
    return getMockDashboardOverview()
  }

  const response = await getJson<DashboardOverview>('/dashboard/')
  if (!response.success) throw response
  return response.data
}
