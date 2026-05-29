import type { FriendLinkListParams, FriendLinkStatus } from '@/features/friend-links/types/friend-link'

const statuses: FriendLinkStatus[] = ['pending', 'approved', 'rejected', 'hidden']

export function parseFriendLinkListSearch(search: Record<string, unknown>): FriendLinkListParams {
  const status = typeof search.status === 'string' && statuses.includes(search.status as FriendLinkStatus)
    ? (search.status as FriendLinkStatus)
    : ''

  return {
    page: positiveNumber(search.page, 1),
    page_size: positiveNumber(search.page_size, 20),
    search: typeof search.search === 'string' ? search.search : '',
    ordering: typeof search.ordering === 'string' && search.ordering ? search.ordering : '-updated_at',
    status,
  }
}

function positiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback
  }
  return Math.floor(parsed)
}
