import type { PhotoListParams } from '@/features/photos/types/photo'

export const photoQueryKeys = {
  all: ['photos'] as const,
  lists: () => [...photoQueryKeys.all, 'list'] as const,
  list: (params: PhotoListParams) => [...photoQueryKeys.lists(), params] as const,
  details: () => [...photoQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...photoQueryKeys.details(), id] as const,
}

