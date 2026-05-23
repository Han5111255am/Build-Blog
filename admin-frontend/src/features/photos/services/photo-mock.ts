import type { ApiSuccessResponse, PaginatedData } from '@/types/api'
import type { PhotoFormValues } from '@/features/photos/schema/photo-form-schema'
import type { PhotoDetail, PhotoListItem, PhotoListParams } from '@/features/photos/types/photo'

let mockPhotos: PhotoListItem[] = [
  { id: 601, caption: '东京清晨街景', slug: 'tokyo-morning', lang: 'zh', location: 'Tokyo', taken_at: '2026-03-06 07:10', original_url: 'https://images.example.com/tokyo-original.jpg', thumbnail_url: 'https://images.example.com/tokyo-thumb.jpg', created_at: '2026-03-07 09:00', updated_at: '2026-03-07 09:40' },
  { id: 602, caption: 'Mountain Sunset', slug: 'mountain-sunset', lang: 'en', location: 'Yunnan', taken_at: '2026-03-05 18:20', original_url: 'https://images.example.com/mountain-original.jpg', thumbnail_url: 'https://images.example.com/mountain-thumb.jpg', created_at: '2026-03-06 11:00', updated_at: '2026-03-06 11:45' },
]

const mockPhotoDetail: PhotoDetail = { ...mockPhotos[0], description: '预置的照片详情说明，用于图库编辑页后续回填。' }

export async function getMockPhotoList(params: PhotoListParams): Promise<PaginatedData<PhotoListItem>> {
  await delay(120)
  let results = [...mockPhotos]
  if (params.lang) results = results.filter((item) => item.lang === params.lang)
  if (params.ordering === 'taken_at') results.sort((a, b) => a.taken_at.localeCompare(b.taken_at))
  if (params.ordering === '-taken_at') results.sort((a, b) => b.taken_at.localeCompare(a.taken_at))
  return {
    count: results.length,
    page: params.page,
    page_size: params.page_size,
    total_pages: Math.max(1, Math.ceil(results.length / params.page_size)),
    results: results.slice((params.page - 1) * params.page_size, params.page * params.page_size),
  }
}

export async function getMockPhotoDetail(id: string): Promise<PhotoDetail> {
  await delay(120)
  return { ...mockPhotoDetail, id: Number(id) || mockPhotoDetail.id }
}

export async function createMockPhoto(payload: PhotoFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  await delay(160)
  const nextId = mockPhotos.length ? Math.max(...mockPhotos.map((item) => item.id)) + 1 : 1
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const listItem: PhotoListItem = {
    id: nextId,
    caption: payload.caption,
    slug: payload.slug,
    lang: payload.lang,
    location: payload.location,
    taken_at: payload.taken_at,
    original_url: payload.original_url,
    thumbnail_url: payload.thumbnail_url,
    created_at: now,
    updated_at: now,
  }
  mockPhotos = [listItem, ...mockPhotos]
  return { success: true, message: '创建成功', data: { id: nextId } }
}

export async function updateMockPhoto(id: number | string, payload: PhotoFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  await delay(160)
  const numericId = typeof id === 'string' ? Number(id) : id
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ')
  mockPhotos = mockPhotos.map((item) =>
    item.id === numericId
      ? {
          ...item,
          caption: payload.caption,
          slug: payload.slug,
          lang: payload.lang,
          location: payload.location,
          taken_at: payload.taken_at,
          original_url: payload.original_url,
          thumbnail_url: payload.thumbnail_url,
          updated_at: now,
        }
      : item,
  )
  return { success: true, message: '保存成功', data: { id: numericId } }
}

export async function deleteMockPhoto(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(140)
  const numericId = typeof id === 'string' ? Number(id) : id
  mockPhotos = mockPhotos.filter((item) => item.id !== numericId)
  return { success: true, message: '删除成功', data: {} }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}

