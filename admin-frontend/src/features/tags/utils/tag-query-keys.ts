import type { TagListParams } from '@/features/tags/types/tag'

export const tagQueryKeys = {
  all: ['tags'] as const,
  lists: () => [...tagQueryKeys.all, 'list'] as const,
  list: (params: TagListParams) => [...tagQueryKeys.lists(), params] as const,
  details: () => [...tagQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...tagQueryKeys.details(), id] as const,
}

