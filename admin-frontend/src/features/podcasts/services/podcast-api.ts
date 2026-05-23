import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type { PodcastFormValues } from '@/features/podcasts/schema/podcast-form-schema'
import type { PodcastDetail, PodcastListItem, PodcastListParams } from '@/features/podcasts/types/podcast'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getPodcastList(params: PodcastListParams): Promise<PaginatedData<PodcastListItem>> {
  if (enableMock) {
    const { getMockPodcastList } = await import('@/features/podcasts/services/podcast-mock')
    return getMockPodcastList(params)
  }
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size), search: params.search, platform: params.platform, lang: params.lang })
  const response = await getJson<PaginatedData<PodcastListItem>>(`/podcasts/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function getPodcastDetail(id: string): Promise<PodcastDetail> {
  if (enableMock) {
    const { getMockPodcastDetail } = await import('@/features/podcasts/services/podcast-mock')
    return getMockPodcastDetail(id)
  }
  const response = await getJson<PodcastDetail>(`/podcasts/${id}/`)
  if (!response.success) throw response
  return response.data
}

export async function createPodcast(payload: PodcastFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  if (enableMock) {
    const { createMockPodcast } = await import('@/features/podcasts/services/podcast-mock')
    return createMockPodcast(payload)
  }
  return resolveMutation(getJson<{ id: number }>('/podcasts/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function updatePodcast(id: string, payload: PodcastFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  if (enableMock) {
    const { updateMockPodcast } = await import('@/features/podcasts/services/podcast-mock')
    return updateMockPodcast(id, payload)
  }
  return resolveMutation(getJson<{ id: number }>(`/podcasts/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }))
}

export async function deletePodcast(id: string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockPodcast } = await import('@/features/podcasts/services/podcast-mock')
    return deleteMockPodcast(id)
  }
  return resolveMutation(getJson<unknown>(`/podcasts/${id}/`, { method: 'DELETE' }))
}

export async function reRenderPodcast(id: string): Promise<ApiSuccessResponse<{ id: number }>> {
  if (enableMock) {
    const { reRenderMockPodcast } = await import('@/features/podcasts/services/podcast-mock')
    return reRenderMockPodcast(id)
  }
  return resolveMutation(getJson<{ id: number }>(`/podcasts/${id}/re-render/`, { method: 'POST' }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

