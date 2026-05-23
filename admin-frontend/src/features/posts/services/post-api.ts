import { getJson } from '@/services/http/get-json'
import type { ApiErrorResponse, ApiSuccessResponse, PaginatedData } from '@/types/api'
import type {
  PostDetail,
  PostListItem,
  PostListParams,
  PostMutationPayload,
  PostMutationResult,
  PostTagOption,
  PostTagOptionCreatePayload,
} from '@/features/posts/types/post'

const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'

export async function getPostList(params: PostListParams): Promise<PaginatedData<PostListItem>> {
  if (enableMock) {
    const { getMockPostList } = await import('@/features/posts/services/post-mock')
    return getMockPostList(params)
  }
  const query = new URLSearchParams({ page: String(params.page), page_size: String(params.page_size), search: params.search, ordering: params.ordering, lang: params.lang, status: params.status })
  const response = await getJson<PaginatedData<PostListItem>>(`/posts/?${query.toString()}`)
  if (!response.success) throw response
  return response.data
}

export async function getPostDetail(id: string): Promise<PostDetail> {
  if (enableMock) {
    const { getMockPostDetail } = await import('@/features/posts/services/post-mock')
    return getMockPostDetail(id)
  }
  const response = await getJson<PostDetail>(`/posts/${id}/`)
  if (!response.success) throw response
  return response.data
}

export async function getPostTagOptions(search = ''): Promise<PostTagOption[]> {
  if (enableMock) {
    const { getMockPostTagOptions } = await import('@/features/posts/services/post-mock')
    return getMockPostTagOptions(search)
  }
  const query = new URLSearchParams()
  if (search.trim()) {
    query.set('search', search.trim())
  }
  const suffix = query.toString() ? `?${query.toString()}` : ''
  const response = await getJson<PostTagOption[]>(`/options/tags/${suffix}`)
  if (!response.success) throw response
  return response.data
}

export async function createPostTagOption(payload: PostTagOptionCreatePayload): Promise<ApiSuccessResponse<PostTagOption>> {
  if (enableMock) {
    const { createMockPostTagOption } = await import('@/features/posts/services/post-mock')
    return createMockPostTagOption(payload)
  }
  return resolveMutation<PostTagOption>(getJson<PostTagOption>('/options/tags/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function createPost(payload: PostMutationPayload): Promise<ApiSuccessResponse<PostMutationResult>> {
  if (enableMock) {
    const { createMockPost } = await import('@/features/posts/services/post-mock')
    return createMockPost(payload)
  }
  return resolveMutation<PostMutationResult>(getJson<PostMutationResult>('/posts/', { method: 'POST', body: JSON.stringify(payload) }))
}

export async function updatePost(id: string, payload: PostMutationPayload): Promise<ApiSuccessResponse<PostMutationResult>> {
  if (enableMock) {
    const { updateMockPost } = await import('@/features/posts/services/post-mock')
    return updateMockPost(id, payload)
  }
  return resolveMutation<PostMutationResult>(getJson<PostMutationResult>(`/posts/${id}/`, { method: 'PATCH', body: JSON.stringify(payload) }))
}

export async function publishPost(id: number | string, publishedAt?: string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { publishMockPost } = await import('@/features/posts/services/post-mock')
    return publishMockPost(id, publishedAt)
  }
  return resolveMutation(getJson<unknown>(`/posts/${id}/publish/`, { method: 'POST', body: JSON.stringify({ published_at: publishedAt ?? null }) }))
}

export async function unpublishPost(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { unpublishMockPost } = await import('@/features/posts/services/post-mock')
    return unpublishMockPost(id)
  }
  return resolveMutation(getJson<unknown>(`/posts/${id}/unpublish/`, { method: 'POST', body: JSON.stringify({}) }))
}

export async function deletePost(id: number | string): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { deleteMockPost } = await import('@/features/posts/services/post-mock')
    return deleteMockPost(id)
  }
  return resolveMutation(getJson<unknown>(`/posts/${id}/`, { method: 'DELETE' }))
}

export async function batchPublishPosts(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { batchPublishMockPosts } = await import('@/features/posts/services/post-mock')
    return batchPublishMockPosts(ids)
  }
  return resolveMutation(getJson<unknown>('/posts/batch-publish/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

export async function batchUnpublishPosts(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { batchUnpublishMockPosts } = await import('@/features/posts/services/post-mock')
    return batchUnpublishMockPosts(ids)
  }
  return resolveMutation(getJson<unknown>('/posts/batch-unpublish/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

export async function batchDeletePosts(ids: number[]): Promise<ApiSuccessResponse<unknown>> {
  if (enableMock) {
    const { batchDeleteMockPosts } = await import('@/features/posts/services/post-mock')
    return batchDeleteMockPosts(ids)
  }
  return resolveMutation(getJson<unknown>('/posts/batch-delete/', { method: 'POST', body: JSON.stringify({ ids }) }))
}

async function resolveMutation<T>(request: Promise<ApiSuccessResponse<T> | ApiErrorResponse>) {
  const response = await request
  if (!response.success) throw response as ApiErrorResponse
  return response
}

