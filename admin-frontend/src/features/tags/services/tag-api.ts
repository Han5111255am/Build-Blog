import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type {
  TagDetail,
  TagListItem,
  TagListParams,
  TagMutationPayload,
  TagMutationResult,
  TagUsageUnlinkPayload,
} from '@/features/tags/types/tag'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getTagList(params: TagListParams): Promise<PaginatedData<TagListItem>> {
  if (enableMock) {
    const { getMockTagList } = await import('@/features/tags/services/tag-mock')
    return getMockTagList(params)
  }
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
    search: params.search,
    ordering: params.ordering,
  })
  const response = await getJson<PaginatedData<TagListItem>>(`/tags/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function getTagDetail(id: string): Promise<TagDetail> {
  if (enableMock) {
    const { getMockTagDetail } = await import('@/features/tags/services/tag-mock')
    return getMockTagDetail(id)
  }
  const response = await getJson<TagDetail>(`/tags/${id}/`)
  if (!response.success) throw response
  return response.data
}

export async function createTag(payload: TagMutationPayload): Promise<ApiSuccessResponse<TagMutationResult>> {
  if (enableMock) {
    const { createMockTag } = await import('@/features/tags/services/tag-mock')
    return createMockTag(payload)
  }
  return resolveMutation<TagMutationResult>(getJson<TagMutationResult>('/tags/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function updateTag(id: string, payload: TagMutationPayload): Promise<ApiSuccessResponse<TagMutationResult>> {
  if (enableMock) {
    const { updateMockTag } = await import('@/features/tags/services/tag-mock')
    return updateMockTag(id, payload)
  }
  return resolveMutation<TagMutationResult>(getJson<TagMutationResult>(`/tags/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }))
}

export async function deleteTag(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockTag } = await import('@/features/tags/services/tag-mock')
    return deleteMockTag(id)
  }
  return resolveMutation(getJson<unknown>(`/tags/${id}/`, { method: 'DELETE' }))
}

export async function unlinkTagUsage(
  id: number | string,
  payload: TagUsageUnlinkPayload,
): Promise<ApiSuccessResponse<TagDetail>> {
  if (enableMock) {
    const { unlinkMockTagUsage } = await import('@/features/tags/services/tag-mock')
    return unlinkMockTagUsage(id, payload)
  }
  return resolveMutation<TagDetail>(getJson<TagDetail>(`/tags/${id}/unlink/`, { method: 'POST', body: JSON.stringify(payload) }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}
