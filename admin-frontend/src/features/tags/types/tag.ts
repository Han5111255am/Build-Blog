import type { TagFormValues } from '@/features/tags/schema/tag-form-schema'

export interface TagListItem {
  id: number
  slug: string
  name: string
  color: string
  description: string
  post_count: number
  note_count: number
  project_count: number
  created_at: string
  updated_at: string
}

export interface TagListParams {
  page: number
  page_size: number
  search: string
  ordering: string
}

export interface TagUsageItem {
  content_type: 'post' | 'note' | 'project'
  item_id: number
  title: string
  slug: string
  status: string
  updated_at: string
}

export interface TagDetail extends TagListItem {
  usage_text: string
  usage_items: TagUsageItem[]
}

export type TagMutationPayload = TagFormValues

export interface TagMutationResult {
  id?: number
}

export interface TagUsageUnlinkPayload {
  content_type: TagUsageItem['content_type']
  item_id: number
}
