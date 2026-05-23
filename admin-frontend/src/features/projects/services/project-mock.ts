import type { ProjectDetail, ProjectListItem, ProjectListParams, ProjectMutationPayload, ProjectMutationResult } from '@/features/projects/types/project'
import type { ApiSuccessResponse } from '@/types/api'
import type { PaginatedData } from '@/types/api'

const mockRows: ProjectListItem[] = [
  {
    id: 301,
    slug: 'personal-blog-admin',
    title: 'Personal Blog Admin',
    lang: 'zh',
    status: 'published',
    summary: '用于展示项目编辑页接口接入骨架的数据样例。',
    site_url: 'https://example.com/personal-blog-admin',
    repo_url: 'https://github.com/example/personal-blog-admin',
    icon: 'sparkles',
    cover_image: 'https://images.example.com/project-cover.png',
    display_order: 1,
    published_at: '2026-03-07 10:30',
    created_at: '2026-03-07 09:20',
    updated_at: '2026-03-07 11:40',
  },
  {
    id: 302,
    slug: 'design-system-refresh',
    title: 'Design System Refresh',
    lang: 'en',
    status: 'draft',
    summary: 'A sample project row for admin project workflows.',
    site_url: 'https://example.com/design-system-refresh',
    repo_url: 'https://github.com/example/design-system-refresh',
    icon: 'palette',
    cover_image: '',
    display_order: 2,
    published_at: '',
    created_at: '2026-03-06 18:00',
    updated_at: '2026-03-06 19:40',
  },
]

const mockProjectDetail: ProjectDetail = {
  ...mockRows[0],
  content_md: '# Personal Blog Admin\n\n这里是当前项目说明的预置内容。',
  content_html: '<h1>Personal Blog Admin</h1><p>这里是当前项目说明的预置内容。</p>',
}

export async function getMockProjectList(params: ProjectListParams): Promise<PaginatedData<ProjectListItem>> {
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

  if (params.ordering === 'display_order') results.sort((a, b) => a.display_order - b.display_order)
  if (params.ordering === '-display_order') results.sort((a, b) => b.display_order - a.display_order)
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

export async function getMockProjectDetail(id: string): Promise<ProjectDetail> {
  await delay(120)
  return { ...mockProjectDetail, id: Number(id) || mockProjectDetail.id }
}

export async function createMockProject(_payload: ProjectMutationPayload): Promise<ApiSuccessResponse<ProjectMutationResult>> {
  await delay(120)
  return { success: true, message: '项目已保存，已同步展示配置', data: { id: 999 } }
}

export async function updateMockProject(id: string, _payload: ProjectMutationPayload): Promise<ApiSuccessResponse<ProjectMutationResult>> {
  await delay(120)
  return { success: true, message: `项目 #${id} 已更新，已同步展示配置`, data: { id: Number(id) } }
}

export async function deleteMockProject(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `项目 #${id} 已删除`, data: null }
}

export async function reorderMockProjects(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  await delay(120)
  return { success: true, message: `已保存 ${ids.length} 个项目的展示顺序`, data: { ids } }
}

function delay(time: number) {
  return new Promise((resolve) => window.setTimeout(resolve, time))
}
