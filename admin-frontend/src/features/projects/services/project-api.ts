import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type { ProjectDetail, ProjectListItem, ProjectListParams, ProjectMutationPayload, ProjectMutationResult } from '@/features/projects/types/project'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getProjectList(params: ProjectListParams): Promise<PaginatedData<ProjectListItem>> {
  if (enableMock) {
    const { getMockProjectList } = await import('@/features/projects/services/project-mock')
    return getMockProjectList(params)
  }
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size), search: params.search, ordering: params.ordering, lang: params.lang, status: params.status })
  const response = await getJson<PaginatedData<ProjectListItem>>(`/projects/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function getProjectDetail(id: string): Promise<ProjectDetail> {
  if (enableMock) {
    const { getMockProjectDetail } = await import('@/features/projects/services/project-mock')
    return getMockProjectDetail(id)
  }
  const response = await getJson<ProjectDetail>(`/projects/${id}/`)
  if (!response.success) throw response
  return response.data
}

export async function createProject(payload: ProjectMutationPayload): Promise<ApiSuccessResponse<ProjectMutationResult>> {
  if (enableMock) {
    const { createMockProject } = await import('@/features/projects/services/project-mock')
    return createMockProject(payload)
  }
  return resolveMutation<ProjectMutationResult>(getJson<ProjectMutationResult>('/projects/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function updateProject(id: string, payload: ProjectMutationPayload): Promise<ApiSuccessResponse<ProjectMutationResult>> {
  if (enableMock) {
    const { updateMockProject } = await import('@/features/projects/services/project-mock')
    return updateMockProject(id, payload)
  }
  return resolveMutation<ProjectMutationResult>(getJson<ProjectMutationResult>(`/projects/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }))
}

export async function deleteProject(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockProject } = await import('@/features/projects/services/project-mock')
    return deleteMockProject(id)
  }
  return resolveMutation(getJson<unknown>(`/projects/${id}/`, { method: 'DELETE' }))
}

export async function reorderProjects(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { reorderMockProjects } = await import('@/features/projects/services/project-mock')
    return reorderMockProjects(ids)
  }
  return resolveMutation(getJson<unknown>('/projects/reorder/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

