import type {
  NoteDetail,
  NoteListItem,
  NoteListParams,
  NoteMutationPayload,
  NoteMutationResult,
  NoteTagOption,
  NoteTagOptionCreatePayload,
} from '@/features/notes/types/note'
import type { ApiSuccessResponse } from '@/types/api'
import type { PaginatedData } from '@/types/api'

const mockRows: NoteListItem[] = [
  {
    id: 201,
    slug: 'lightweight-admin-note',
    title: '产品随记：管理后台轻编辑体验',
    lang: 'zh',
    status: 'draft',
    summary: '用于展示 Notes 编辑页接口接入骨架的数据样例。',
    reading_time: 4,
    tags: [{ id: 1, slug: 'notes', name: 'Notes' }],
    published_at: '',
    created_at: '2026-03-07 10:00',
    updated_at: '2026-03-07 11:20',
  },
  {
    id: 202,
    slug: 'smaller-writing-flow',
    title: 'Writing Smaller Notes with Better Flow',
    lang: 'en',
    status: 'published',
    summary: 'A lightweight note editing sample for admin workflows.',
    reading_time: 3,
    tags: [{ id: 2, slug: 'ux', name: 'UX' }],
    published_at: '2026-03-06 21:10',
    created_at: '2026-03-06 20:40',
    updated_at: '2026-03-06 21:12',
  },
]

const mockNoteDetail: NoteDetail = {
  ...mockRows[0],
  tag_ids: [1, 3],
  content_md: '# 产品随记：管理后台轻编辑体验\n\n这里是当前笔记的预置正文。',
  content_html: '<h1>产品随记：管理后台轻编辑体验</h1><p>这里是当前笔记的预置正文。</p>',
  toc_json: '[{"title":"产品随记：管理后台轻编辑体验","depth":1}]',
}

export async function getMockNoteList(params: NoteListParams): Promise<PaginatedData<NoteListItem>> {
  await delay(120)
  return {
    count: mockRows.length,
    page: params.page,
    page_size: params.page_size,
    total_pages: 1,
    results: mockRows,
  }
}

export async function getMockNoteDetail(id: string): Promise<NoteDetail> {
  await delay(120)
  return { ...mockNoteDetail, id: Number(id) || mockNoteDetail.id }
}

const mockNoteTagOptions: NoteTagOption[] = [
  { id: 1, slug: 'notes', name: 'Notes' },
  { id: 2, slug: 'ux', name: 'UX' },
  { id: 3, slug: 'product', name: 'Product' },
  { id: 4, slug: 'writing', name: 'Writing' },
]

export async function getMockNoteTagOptions(search = '') {
  await delay(120)
  const keyword = search.trim().toLowerCase()
  if (!keyword) {
    return mockNoteTagOptions
  }
  return mockNoteTagOptions.filter((item) => [item.name, item.slug].some((field) => field.toLowerCase().includes(keyword)))
}

export async function createMockNoteTagOption(payload: NoteTagOptionCreatePayload): Promise<ApiSuccessResponse<NoteTagOption>> {
  await delay(120)
  return {
    success: true,
    message: `标签 ${payload.name} 已创建。`,
    data: {
      id: 999,
      slug: payload.slug || payload.name.toLowerCase().replace(/\s+/g, '-'),
      name: payload.name,
    },
  }
}

function buildMockMutationResult(id: number, payload: NoteMutationPayload): NoteMutationResult {
  const resolvedTags = mockNoteTagOptions.filter((item) => payload.tag_ids.includes(item.id))
  const publishedAt =
    payload.status === 'published' ? payload.published_at ?? '2026-04-01 09:30' : payload.published_at ?? ''
  return {
    ...mockNoteDetail,
    id,
    slug: payload.slug || `note-${id}`,
    title: payload.title,
    lang: payload.lang,
    status: payload.status,
    summary: payload.summary,
    published_at: publishedAt,
    updated_at: '2026-04-01 09:30',
    tag_ids: payload.tag_ids,
    tags: resolvedTags,
    content_md: payload.content_md,
  }
}

export async function createMockNote(payload: NoteMutationPayload): Promise<ApiSuccessResponse<NoteMutationResult>> {
  await delay(120)
  return { success: true, message: '笔记已保存，已提交渲染任务', data: buildMockMutationResult(999, payload) }
}

export async function updateMockNote(id: string, payload: NoteMutationPayload): Promise<ApiSuccessResponse<NoteMutationResult>> {
  await delay(120)
  return { success: true, message: `笔记 #${id} 已更新，已提交渲染任务`, data: buildMockMutationResult(Number(id), payload) }
}

export async function publishMockNote(id: number | string, publishedAt?: string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `笔记 #${id} 已发布`, data: { id: Number(id), published_at: publishedAt ?? 'now' } }
}

export async function unpublishMockNote(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `笔记 #${id} 已转为草稿`, data: { id: Number(id), status: 'draft' } }
}

export async function deleteMockNote(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `笔记 #${id} 已删除`, data: null }
}

export async function batchPublishMockNotes(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已批量发布 ${ids.length} 条笔记`, data: { ids } }
}

export async function batchUnpublishMockNotes(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已批量转草稿 ${ids.length} 条笔记`, data: { ids } }
}

export async function batchDeleteMockNotes(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已批量删除 ${ids.length} 条笔记`, data: { ids } }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
