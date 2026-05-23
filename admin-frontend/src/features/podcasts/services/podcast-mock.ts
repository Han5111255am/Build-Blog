import type { PodcastFormValues } from '@/features/podcasts/schema/podcast-form-schema'
import type { PodcastDetail, PodcastListItem, PodcastListParams } from '@/features/podcasts/types/podcast'
import type { ApiSuccessResponse, PaginatedData } from '@/types/api'

let mockPodcasts: PodcastListItem[] = [
  {
    id: 701,
    title: '设计与工程周报',
    slug: 'design-engineering-weekly',
    platform: 'spotify',
    url: 'https://example.com/podcast/design-engineering-weekly',
    lang: 'zh',
    cover_asset_id: 11,
    cover_url: 'https://images.example.com/podcast-cover.jpg',
    published_at: '2026-03-07 08:00',
    created_at: '2026-03-07 08:30',
    updated_at: '2026-03-07 09:10',
  },
  {
    id: 702,
    title: 'Frontend Workflow Notes',
    slug: 'frontend-workflow-notes',
    platform: 'apple',
    url: 'https://example.com/podcast/frontend-workflow-notes',
    lang: 'en',
    cover_asset_id: null,
    cover_url: '',
    published_at: '2026-03-06 20:30',
    created_at: '2026-03-06 21:00',
    updated_at: '2026-03-06 21:35',
  },
]

let mockPodcastDetails: PodcastDetail[] = [
  {
    ...mockPodcasts[0],
    content_md: '# Show Notes\n\n- 第一条\n- 第二条',
    content_html: '<h1>Show Notes</h1><ul><li>第一条</li><li>第二条</li></ul>',
  },
  {
    ...mockPodcasts[1],
    content_md: '## Notes\n\nHello world',
    content_html: '<h2>Notes</h2><p>Hello world</p>',
  },
]

export async function getMockPodcastList(params: PodcastListParams): Promise<PaginatedData<PodcastListItem>> {
  await delay(120)
  let results = [...mockPodcasts]
  if (params.search) {
    const keyword = params.search.toLowerCase()
    results = results.filter((item) => item.title.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword))
  }
  if (params.platform) results = results.filter((item) => item.platform === params.platform)
  if (params.lang) results = results.filter((item) => item.lang === params.lang)
  return {
    count: results.length,
    page: params.page,
    page_size: params.page_size,
    total_pages: Math.max(1, Math.ceil(results.length / params.page_size)),
    results: results.slice((params.page - 1) * params.page_size, params.page * params.page_size),
  }
}

export async function getMockPodcastDetail(id: string): Promise<PodcastDetail> {
  await delay(120)
  const numericId = Number(id)
  const found = mockPodcastDetails.find((item) => item.id === numericId)
  return found ? { ...found } : { ...mockPodcastDetails[0], id: numericId || mockPodcastDetails[0].id }
}

export async function createMockPodcast(payload: PodcastFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  await delay(120)
  const newId = Math.max(...mockPodcasts.map((item) => item.id), 700) + 1
  const now = new Date().toISOString()
  const listItem: PodcastListItem = {
    id: newId,
    title: payload.title,
    slug: payload.slug || `podcast-${newId}`,
    platform: payload.platform,
    url: payload.url,
    lang: payload.lang,
    cover_asset_id: payload.cover_asset_id ?? null,
    cover_url: payload.cover_url ?? '',
    published_at: payload.published_at,
    created_at: now,
    updated_at: now,
  }
  mockPodcasts = [listItem, ...mockPodcasts]
  mockPodcastDetails = [
    {
      ...listItem,
      content_md: payload.content_md,
      content_html: renderMockMarkdown(payload.content_md),
    },
    ...mockPodcastDetails,
  ]

  return { success: true, message: '已创建播客（mock）', data: { id: newId } }
}

export async function updateMockPodcast(id: string, payload: PodcastFormValues): Promise<ApiSuccessResponse<{ id: number }>> {
  await delay(120)
  const numericId = Number(id)
  const now = new Date().toISOString()

  mockPodcasts = mockPodcasts.map((item) =>
    item.id === numericId
      ? {
          ...item,
          title: payload.title,
          slug: payload.slug || item.slug,
          platform: payload.platform,
          url: payload.url,
          lang: payload.lang,
          cover_asset_id: payload.cover_asset_id ?? null,
          cover_url: payload.cover_url ?? '',
          published_at: payload.published_at,
          updated_at: now,
        }
      : item,
  )

  mockPodcastDetails = mockPodcastDetails.map((detail) =>
    detail.id === numericId
      ? {
          ...detail,
          title: payload.title,
          slug: payload.slug || detail.slug,
          platform: payload.platform,
          url: payload.url,
          lang: payload.lang,
          cover_asset_id: payload.cover_asset_id ?? null,
          cover_url: payload.cover_url ?? '',
          published_at: payload.published_at,
          content_md: payload.content_md,
          content_html: renderMockMarkdown(payload.content_md),
          updated_at: now,
        }
      : detail,
  )

  return { success: true, message: '已保存播客（mock）', data: { id: numericId } }
}

export async function deleteMockPodcast(id: string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  const numericId = Number(id)
  mockPodcasts = mockPodcasts.filter((item) => item.id !== numericId)
  mockPodcastDetails = mockPodcastDetails.filter((item) => item.id !== numericId)
  return { success: true, message: '已删除播客（mock）', data: null }
}

export async function reRenderMockPodcast(id: string): Promise<ApiSuccessResponse<{ id: number }>> {
  await delay(120)
  const numericId = Number(id)
  const target = mockPodcastDetails.find((item) => item.id === numericId)
  if (!target) {
    return { success: true, message: '未找到播客（mock）', data: { id: numericId } }
  }
  target.content_html = renderMockMarkdown(target.content_md)
  target.updated_at = new Date().toISOString()
  return { success: true, message: '已重新渲染 Show Notes（mock）', data: { id: numericId } }
}

function renderMockMarkdown(md: string) {
  const escaped = md
    .split('&')
    .join('&amp;')
    .split('<')
    .join('&lt;')
    .split('>')
    .join('&gt;')
    .split('\n')
    .join('<br />')
  return `<div>${escaped}</div>`
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}

