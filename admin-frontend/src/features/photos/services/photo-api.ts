import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type { PhotoFormValues } from '@/features/photos/schema/photo-form-schema'
import type { PhotoDetail, PhotoListItem, PhotoListParams } from '@/features/photos/types/photo'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getPhotoList(params: PhotoListParams): Promise<PaginatedData<PhotoListItem>> {
  if (enableMock) {
    const { getMockPhotoList } = await import('@/features/photos/services/photo-mock')
    return getMockPhotoList(params)
  }
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size), ordering: params.ordering, lang: params.lang })
  const response = await getJson<PaginatedData<PhotoListItem>>(`/photos/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function getPhotoDetail(id: string): Promise<PhotoDetail> {
  if (enableMock) {
    const { getMockPhotoDetail } = await import('@/features/photos/services/photo-mock')
    return getMockPhotoDetail(id)
  }
  const response = await getJson<PhotoDetail>(`/photos/${id}/`)
  if (!response.success) throw response
  return response.data
}

export async function createPhoto(payload: PhotoFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  if (enableMock) {
    const { createMockPhoto } = await import('@/features/photos/services/photo-mock')
    return createMockPhoto(payload)
  }
  return resolveMutation(getJson<{ id: number }>('/photos/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function updatePhoto(id: string, payload: PhotoFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  if (enableMock) {
    const { updateMockPhoto } = await import('@/features/photos/services/photo-mock')
    return updateMockPhoto(id, payload)
  }
  return resolveMutation(getJson<{ id: number }>(`/photos/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }))
}

export async function deletePhoto(id: string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockPhoto } = await import('@/features/photos/services/photo-mock')
    return deleteMockPhoto(id)
  }
  return resolveMutation(getJson<unknown>(`/photos/${id}/`, { method: 'DELETE' }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

