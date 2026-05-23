import type {
  PostDetail,
  PostListItem,
  PostListParams,
  PostMutationPayload,
  PostMutationResult,
  PostTagOption,
  PostTagOptionCreatePayload,
} from '@/features/posts/types/post'
import type { ApiSuccessResponse } from '@/types/api'
import type { PaginatedData } from '@/types/api'

const mockRows: PostListItem[] = [
  {
    id: 101,
    slug: 'modern-admin-scaffold',
    title: '现代后台工程骨架实践',
    lang: 'zh',
    status: 'draft',
    summary: '后台骨架与实现阶段说明。',
    cover_image: '',
    reading_time: 8,
    tags: [{ id: 1, slug: 'backend', name: 'Backend' }],
    published_at: '',
    created_at: '2026-03-07 09:40',
    updated_at: '2026-03-07 10:30',
  },
  {
    id: 102,
    slug: 'django-publish-flow',
    title: 'Django 内容系统发布链路整理',
    lang: 'zh',
    status: 'published',
    summary: '梳理发布链路与缓存失效。',
    cover_image: '',
    reading_time: 6,
    tags: [{ id: 2, slug: 'django', name: 'Django' }],
    published_at: '2026-03-06 21:00',
    created_at: '2026-03-06 20:00',
    updated_at: '2026-03-06 21:10',
  },
  {
    id: 103,
    slug: 'calm-admin-interface',
    title: 'Building a Calm Admin Interface',
    lang: 'en',
    status: 'published',
    summary: 'Notes on a calm and focused admin UX.',
    cover_image: '',
    reading_time: 5,
    tags: [{ id: 3, slug: 'ux', name: 'UX' }],
    published_at: '2026-03-05 09:20',
    created_at: '2026-03-05 09:00',
    updated_at: '2026-03-05 09:45',
  },
]

const mockPostDetail: PostDetail = {
  ...mockRows[0],
  tag_ids: [1, 2],
  content_md: '# 现代后台工程骨架实践\n\n这是当前文章内容的骨架预置。',
  content_html: '<h1>现代后台工程骨架实践</h1><p>这是当前文章内容的骨架预置。</p>',
  toc_json: '[{"title":"现代后台工程骨架实践","depth":1}]',
}

export async function getMockPostList(params: PostListParams): Promise<PaginatedData<PostListItem>> {
  await delay(120)
  let results = [...mockRows]

  if (params.search) {
    const keyword = params.search.toLowerCase()
    results = results.filter((item) => [item.title, item.slug, item.summary].some((field) => field.toLowerCase().includes(keyword)))
  }

  if (params.lang) {
    results = results.filter((item) => item.lang === params.lang)
  }

  if (params.status) {
    results = results.filter((item) => item.status === params.status)
  }

  if (params.ordering === 'published_at') results.sort((a, b) => a.published_at.localeCompare(b.published_at))
  if (params.ordering === '-published_at') results.sort((a, b) => b.published_at.localeCompare(a.published_at))
  if (params.ordering === 'title') results.sort((a, b) => a.title.localeCompare(b.title))
  if (params.ordering === '-title') results.sort((a, b) => b.title.localeCompare(a.title))
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

export async function getMockPostDetail(id: string): Promise<PostDetail> {
  await delay(120)
  return { ...mockPostDetail, id: Number(id) || mockPostDetail.id }
}

const mockPostTagOptions: PostTagOption[] = [
  { id: 1, slug: 'backend', name: 'Backend' },
  { id: 2, slug: 'django', name: 'Django' },
  { id: 3, slug: 'ux', name: 'UX' },
  { id: 4, slug: 'frontend', name: 'Frontend' },
]

export async function getMockPostTagOptions(search = '') {
  await delay(120)
  const keyword = search.trim().toLowerCase()
  if (!keyword) {
    return mockPostTagOptions
  }
  return mockPostTagOptions.filter((item) => [item.name, item.slug].some((field) => field.toLowerCase().includes(keyword)))
}

export async function createMockPostTagOption(payload: PostTagOptionCreatePayload): Promise<ApiSuccessResponse<PostTagOption>> {
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

function buildMockMutationResult(id: number, payload: PostMutationPayload): PostMutationResult {
  const resolvedTags = mockPostTagOptions.filter((item) => payload.tag_ids.includes(item.id))
  const publishedAt =
    payload.status === 'published' ? payload.published_at ?? '2026-04-01 09:30' : payload.published_at ?? ''
  return {
    ...mockPostDetail,
    id,
    slug: payload.slug || `post-${id}`,
    title: payload.title,
    lang: payload.lang,
    status: payload.status,
    summary: payload.summary,
    cover_image: payload.cover_image,
    published_at: publishedAt,
    updated_at: '2026-04-01 09:30',
    tag_ids: payload.tag_ids,
    tags: resolvedTags,
    content_md: payload.content_md,
  }
}

export async function createMockPost(payload: PostMutationPayload): Promise<ApiSuccessResponse<PostMutationResult>> {
  await delay(120)
  return { success: true, message: '文章已保存，已提交渲染任务', data: buildMockMutationResult(999, payload) }
}

export async function updateMockPost(id: string, payload: PostMutationPayload): Promise<ApiSuccessResponse<PostMutationResult>> {
  await delay(120)
  return { success: true, message: `文章 #${id} 已更新，已提交渲染任务`, data: buildMockMutationResult(Number(id), payload) }
}

export async function publishMockPost(id: number | string, publishedAt?: string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `文章 #${id} 已发布`, data: { id: Number(id), published_at: publishedAt ?? 'now' } }
}

export async function unpublishMockPost(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `文章 #${id} 已转为草稿`, data: { id: Number(id), status: 'draft' } }
}

export async function deleteMockPost(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `文章 #${id} 已删除`, data: null }
}

export async function batchPublishMockPosts(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已批量发布 ${ids.length} 篇文章`, data: { ids } }
}

export async function batchUnpublishMockPosts(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已批量转草稿 ${ids.length} 篇文章`, data: { ids } }
}

export async function batchDeleteMockPosts(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已批量删除 ${ids.length} 篇文章`, data: { ids } }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
