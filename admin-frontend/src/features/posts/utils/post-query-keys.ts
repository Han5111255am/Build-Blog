import type { PostListParams } from '@/features/posts/types/post'

export const postQueryKeys = {
  all: ['posts'] as const,
  lists: () => [...postQueryKeys.all, 'list'] as const,
  list: (params: PostListParams) => [...postQueryKeys.lists(), params] as const,
  details: () => [...postQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...postQueryKeys.details(), id] as const,
  options: () => [...postQueryKeys.all, 'options'] as const,
  tagOptions: (search = '') => [...postQueryKeys.options(), 'tags', search] as const,
}

