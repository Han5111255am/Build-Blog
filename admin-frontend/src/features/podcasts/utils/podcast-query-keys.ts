import type { PodcastListParams } from '@/features/podcasts/types/podcast'

export const podcastQueryKeys = {
  all: ['podcasts'] as const,
  lists: () => [...podcastQueryKeys.all, 'list'] as const,
  list: (params: PodcastListParams) => [...podcastQueryKeys.lists(), params] as const,
  details: () => [...podcastQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...podcastQueryKeys.details(), id] as const,
}

