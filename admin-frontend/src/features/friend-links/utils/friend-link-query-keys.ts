import type { FriendLinkListParams } from '@/features/friend-links/types/friend-link'

export const friendLinkQueryKeys = {
  all: ['friend-links'] as const,
  lists: () => [...friendLinkQueryKeys.all, 'list'] as const,
  list: (params: FriendLinkListParams) => [...friendLinkQueryKeys.lists(), params] as const,
}
