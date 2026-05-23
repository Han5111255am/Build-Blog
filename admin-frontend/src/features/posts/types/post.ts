import type { PostFormValues } from '@/features/posts/schema/post-form-schema'

export interface PostTagOption {
  id: number
  slug: string
  name: string
}

export interface PostTagOptionCreatePayload {
  name: string
  slug?: string
}

export interface PostListItem {
  id: number
  slug: string
  title: string
  lang: 'zh' | 'en'
  status: 'draft' | 'published'
  summary: string
  cover_image: string
  reading_time: number
  tags: PostTagOption[]
  published_at: string
  created_at: string
  updated_at: string
}

export interface PostListParams {
  page: number
  page_size: number
  search: string
  ordering: string
  lang: '' | 'zh' | 'en'
  status: '' | 'draft' | 'published'
}

export interface PostDetail extends Omit<PostListItem, 'tags'> {
  tag_ids: number[]
  tags: PostTagOption[]
  content_md: string
  content_html: string
  toc_json: string | Record<string, unknown> | unknown[] | null
}

export interface PostMutationPayload extends Omit<PostFormValues, 'published_at'> {
  published_at: string | null
}

export type PostMutationResult = PostDetail
