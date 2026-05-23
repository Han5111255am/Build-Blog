import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type {
  NoteDetail,
  NoteListItem,
  NoteListParams,
  NoteMutationPayload,
  NoteMutationResult,
  NoteTagOption,
  NoteTagOptionCreatePayload,
} from '@/features/notes/types/note'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getNoteList(params: NoteListParams): Promise<PaginatedData<NoteListItem>> {
  if (enableMock) {
    const { getMockNoteList } = await import('@/features/notes/services/note-mock')
    return getMockNoteList(params)
  }
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size), search: params.search, ordering: params.ordering, lang: params.lang, status: params.status })
  const response = await getJson<PaginatedData<NoteListItem>>(`/notes/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function getNoteDetail(id: string): Promise<NoteDetail> {
  if (enableMock) {
    const { getMockNoteDetail } = await import('@/features/notes/services/note-mock')
    return getMockNoteDetail(id)
  }
  const response = await getJson<NoteDetail>(`/notes/${id}/`)
  if (!response.success) throw response
  return response.data
}

export async function getNoteTagOptions(search = ''): Promise<NoteTagOption[]> {
  if (enableMock) {
    const { getMockNoteTagOptions } = await import('@/features/notes/services/note-mock')
    return getMockNoteTagOptions(search)
  }
  const query = new URLSearchParams()
  if (search.trim()) {
    query.set('search', search.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await getJson<NoteTagOption[]>(`/options/tags/${suffix}`)
  if (!response.success) throw response
  return response.data
}

export async function createNoteTagOption(payload: NoteTagOptionCreatePayload): Promise<ApiSuccessResponse<NoteTagOption>> {
  if (enableMock) {
    const { createMockNoteTagOption } = await import('@/features/notes/services/note-mock')
    return createMockNoteTagOption(payload)
  }
  return resolveMutation<NoteTagOption>(getJson<NoteTagOption>('/options/tags/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function createNote(payload: NoteMutationPayload): Promise<ApiSuccessResponse<NoteMutationResult>> {
  if (enableMock) {
    const { createMockNote } = await import('@/features/notes/services/note-mock')
    return createMockNote(payload)
  }
  return resolveMutation<NoteMutationResult>(getJson<NoteMutationResult>('/notes/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function updateNote(id: string, payload: NoteMutationPayload): Promise<ApiSuccessResponse<NoteMutationResult>> {
  if (enableMock) {
    const { updateMockNote } = await import('@/features/notes/services/note-mock')
    return updateMockNote(id, payload)
  }
  return resolveMutation<NoteMutationResult>(getJson<NoteMutationResult>(`/notes/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }))
}

export async function publishNote(id: number | string, publishedAt?: string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { publishMockNote } = await import('@/features/notes/services/note-mock')
    return publishMockNote(id, publishedAt)
  }
  return resolveMutation(getJson<unknown>(`/notes/${id}/publish/`, { method: 'POST', body: JSON.stringify({ published_at: publishedAt ?? null }) }))
}

export async function unpublishNote(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { unpublishMockNote } = await import('@/features/notes/services/note-mock')
    return unpublishMockNote(id)
  }
  return resolveMutation(getJson<unknown>(`/notes/${id}/unpublish/`, { method: 'POST', body: JSON.stringify({}) }))
}

export async function deleteNote(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockNote } = await import('@/features/notes/services/note-mock')
    return deleteMockNote(id)
  }
  return resolveMutation(getJson<unknown>(`/notes/${id}/`, { method: 'DELETE' }))
}

export async function batchPublishNotes(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { batchPublishMockNotes } = await import('@/features/notes/services/note-mock')
    return batchPublishMockNotes(ids)
  }
  return resolveMutation(getJson<unknown>('/notes/batch-publish/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

export async function batchUnpublishNotes(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { batchUnpublishMockNotes } = await import('@/features/notes/services/note-mock')
    return batchUnpublishMockNotes(ids)
  }
  return resolveMutation(getJson<unknown>('/notes/batch-unpublish/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

export async function batchDeleteNotes(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { batchDeleteMockNotes } = await import('@/features/notes/services/note-mock')
    return batchDeleteMockNotes(ids)
  }
  return resolveMutation(getJson<unknown>('/notes/batch-delete/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

