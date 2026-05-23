import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type { AssetListItem, AssetListParams, AssetUploadResult } from '@/features/assets/types/asset'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getAssetList(params: AssetListParams): Promise<PaginatedData<AssetListItem>> {
  if (enableMock) {
    const { getMockAssetList } = await import('@/features/assets/services/asset-mock')
    return getMockAssetList(params)
  }

  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
    search: params.search,
    mime_type: params.mime_type,
    storage: params.storage,
  })

  const response = await getJson<PaginatedData<AssetListItem>>(`/assets/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function uploadAsset(payload: { file: File; storage?: string }): Promise<ApiSuccessResponse<AssetUploadResult>> {
  if (enableMock) {
    const { uploadMockAsset } = await import('@/features/assets/services/asset-mock')
    return uploadMockAsset(payload.file, payload.storage)
  }

  const form = new FormData()
  form.append('file', payload.file)
  if (payload.storage) {
    form.append('storage', payload.storage)
  }

  return resolveMutation(getJson<AssetUploadResult>('/assets/upload/', { method: 'POST', body: form }))
}

export async function deleteAsset(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockAsset } = await import('@/features/assets/services/asset-mock')
    return deleteMockAsset(id)
  }

  return resolveMutation(getJson<unknown>(`/assets/${id}/`, { method: 'DELETE' }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

