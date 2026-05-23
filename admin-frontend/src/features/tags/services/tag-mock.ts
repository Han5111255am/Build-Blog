import type {
  TagDetail,
  TagListItem,
  TagListParams,
  TagMutationPayload,
  TagMutationResult,
  TagUsageItem,
  TagUsageUnlinkPayload,
} from '@/features/tags/types/tag'
import type { ApiSuccessResponse, PaginatedData } from '@/types/api'

const mockRows: TagListItem[] = [
  {
    id: 401,
    slug: 'frontend',
    name: '前端',
    color: '#6366F1',
    description: '用于标记前端工程、交互和设计系统相关内容。',
    post_count: 1,
    note_count: 1,
    project_count: 1,
    created_at: '2026-03-07 09:00',
    updated_at: '2026-03-12 10:30',
  },
  {
    id: 402,
    slug: 'backend',
    name: '后端',
    color: '#0EA5E9',
    description: '用于标记接口、服务与系统实现相关内容。',
    post_count: 4,
    note_count: 1,
    project_count: 0,
    created_at: '2026-03-06 18:10',
    updated_at: '2026-03-06 19:30',
  },
]

const mockUsageItems: TagUsageItem[] = [
  {
    content_type: 'post',
    item_id: 101,
    title: 'Modern Frontend Delivery',
    slug: 'modern-frontend-delivery',
    status: 'published',
    updated_at: '2026-03-12 10:30',
  },
  {
    content_type: 'note',
    item_id: 202,
    title: 'Design Tokens Audit',
    slug: 'design-tokens-audit',
    status: 'draft',
    updated_at: '2026-03-11 18:20',
  },
  {
    content_type: 'project',
    item_id: 303,
    title: 'Admin Experience Refresh',
    slug: 'admin-experience-refresh',
    status: 'published',
    updated_at: '2026-03-10 09:15',
  },
]

const mockTagDetail: TagDetail = {
  ...mockRows[0],
  usage_text: 'Currently referenced by 3 items',
  usage_items: mockUsageItems,
}

export async function getMockTagList(params: TagListParams): Promise<PaginatedData<TagListItem>> {
  await delay(120)
  let results = [...mockRows]

  if (params.search) {
    const keyword = params.search.toLowerCase()
    results = results.filter((item) =>
      [item.name, item.slug, item.description].some((field) => field.toLowerCase().includes(keyword)),
    )
  }

  if (params.ordering === 'name') results.sort((a, b) => a.name.localeCompare(b.name))
  if (params.ordering === '-name') results.sort((a, b) => b.name.localeCompare(a.name))
  if (params.ordering === 'updated_at') results.sort((a, b) => a.updated_at.localeCompare(b.updated_at))
  if (params.ordering === '-updated_at') results.sort((a, b) => b.updated_at.localeCompare(a.updated_at))

  return {
    count: results.length,
    page: params.page,
    page_size: params.page_size,
    total_pages: Math.max(1, Math.ceil(results.length / params.page_size)),
    results: results.slice((params.page - 1) * params.page_size, params.page * params.page_size),
  }
}

export async function getMockTagDetail(id: string): Promise<TagDetail> {
  await delay(120)
  return { ...mockTagDetail, id: Number(id) || mockTagDetail.id }
}

export async function createMockTag(_payload: TagMutationPayload): Promise<ApiSuccessResponse<TagMutationResult>> {
  await delay(120)
  return { success: true, message: '标签已保存，引用明细会在下一次刷新后同步。', data: { id: 999 } }
}

export async function updateMockTag(id: string, _payload: TagMutationPayload): Promise<ApiSuccessResponse<TagMutationResult>> {
  await delay(120)
  return { success: true, message: `标签 #${id} 已更新。`, data: { id: Number(id) } }
}

export async function deleteMockTag(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `标签 #${id} 已删除。`, data: null }
}

export async function unlinkMockTagUsage(
  id: number | string,
  payload: TagUsageUnlinkPayload,
): Promise<ApiSuccessResponse<TagDetail>> {
  await delay(120)
  const usageItems = mockUsageItems.filter(
    (item) => !(item.content_type === payload.content_type && item.item_id === payload.item_id),
  )
  const postCount = usageItems.filter((item) => item.content_type === 'post').length
  const noteCount = usageItems.filter((item) => item.content_type === 'note').length
  const projectCount = usageItems.filter((item) => item.content_type === 'project').length

  return {
    success: true,
    message: `Tag #${id} reference removed.`,
    data: {
      ...mockTagDetail,
      id: Number(id) || mockTagDetail.id,
      post_count: postCount,
      note_count: noteCount,
      project_count: projectCount,
      usage_text: `Currently referenced by ${usageItems.length} items`,
      usage_items: usageItems,
    },
  }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
