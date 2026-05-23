import type { ApiSuccessResponse, PaginatedData } from '@/types/api'
import type { AssetListItem, AssetListParams, AssetUploadResult } from '@/features/assets/types/asset'

let mockAssets: AssetListItem[] = [
  { id: 501, name: 'cover-dashboard.png', url: 'https://images.example.com/cover-dashboard.png', mime_type: 'image/png', storage: 's3', size: 248000, created_at: '2026-03-07 09:20' },
  { id: 502, name: 'podcast-cover.jpg', url: 'https://images.example.com/podcast-cover.jpg', mime_type: 'image/jpeg', storage: 's3', size: 332100, created_at: '2026-03-07 09:45' },
  { id: 503, name: 'gallery-original.webp', url: 'https://images.example.com/gallery-original.webp', mime_type: 'image/webp', storage: 'local', size: 512400, created_at: '2026-03-07 10:10' },
]

export async function getMockAssetList(params: AssetListParams): Promise<PaginatedData<AssetListItem>> {
  await delay(120)
  let results = [...mockAssets]

  if (params.search) {
    const keyword = params.search.toLowerCase()
    results = results.filter((item) => item.name.toLowerCase().includes(keyword) || item.url.toLowerCase().includes(keyword))
  }

  if (params.mime_type) results = results.filter((item) => item.mime_type.startsWith(params.mime_type))
  if (params.storage) results = results.filter((item) => item.storage === params.storage)

  return {
    count: results.length,
    page: params.page,
    page_size: params.page_size,
    total_pages: Math.max(1, Math.ceil(results.length / params.page_size)),
    results: results.slice((params.page - 1) * params.page_size, params.page * params.page_size),
  }
}

export async function uploadMockAsset(file: File, storage?: string): Promise<ApiSuccessResponse<AssetUploadResult>> {
  await delay(160)
  const nextId = mockAssets.length ? Math.max(...mockAssets.map((item) => item.id)) + 1 : 1
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const item: AssetListItem = {
    id: nextId,
    name: file.name,
    url: `https://images.example.com/uploads/${encodeURIComponent(file.name)}`,
    mime_type: file.type || 'application/octet-stream',
    storage: storage || 'local',
    size: file.size,
    created_at: now,
  }
  mockAssets = [item, ...mockAssets]
  return { success: true, message: '上传成功', data: item }
}

export async function deleteMockAsset(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  const numericId = typeof id === 'string' ? Number(id) : id
  mockAssets = mockAssets.filter((item) => item.id !== numericId)
  return { success: true, message: '删除成功', data: {} }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}

