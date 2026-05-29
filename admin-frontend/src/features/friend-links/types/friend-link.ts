export type FriendLinkStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

export interface FriendLinkItem {
  id: number
  site_name: string
  site_url: string
  logo_url: string
  description: string
  contact_email: string
  contact_note: string
  review_note: string
  status: FriendLinkStatus
  display_order: number
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface FriendLinkListParams {
  page: number
  page_size: number
  search: string
  ordering: string
  status: '' | FriendLinkStatus
}

export interface FriendLinkMutationPayload {
  site_name: string
  site_url: string
  logo_url: string
  description: string
  contact_email: string
  contact_note: string
  review_note: string
  status: FriendLinkStatus
  display_order: number
}
