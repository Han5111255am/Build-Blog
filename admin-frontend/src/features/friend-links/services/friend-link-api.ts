import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type {
  FriendLinkItem,
  FriendLinkListParams,
  FriendLinkMutationPayload,
} from '@/features/friend-links/types/friend-link'

export async function getFriendLinkList(params: FriendLinkListParams): Promise<PaginatedData<FriendLinkItem>> {
  const query = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.page_size),
    search: params.search,
    ordering: params.ordering,
    status: params.status,
  })
  const response = await getJson<PaginatedData<FriendLinkItem>>(`/friend-links/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function approveFriendLink(id: number, displayOrder: number): Promise<ApiSuccessResponse<FriendLinkItem>> {
  return resolveMutation(getJson<FriendLinkItem>(`/friend-links/${id}/approve/`, {
    method: 'POST',
    body: JSON.stringify({ display_order: displayOrder }),
  }))
}

export async function rejectFriendLink(id: number, reviewNote: string): Promise<ApiSuccessResponse<FriendLinkItem>> {
  return resolveMutation(getJson<FriendLinkItem>(`/friend-links/${id}/reject/`, {
    method: 'POST',
    body: JSON.stringify({ review_note: reviewNote }),
  }))
}

export async function updateFriendLink(id: number, payload: FriendLinkMutationPayload): Promise<ApiSuccessResponse<FriendLinkItem>> {
  return resolveMutation(getJson<FriendLinkItem>(`/friend-links/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }))
}

export async function deleteFriendLink(id: number): Promise<ApiSuccessResponse<unknown>> {
  return resolveMutation(getJson<unknown>(`/friend-links/${id}/`, { method: 'DELETE' }))
}

export async function reorderFriendLinks(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  return resolveMutation(getJson<unknown>('/friend-links/reorder/', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}
