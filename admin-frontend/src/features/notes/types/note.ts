import type { NoteFormValues } from '@/features/notes/schema/note-form-schema'

export interface NoteTagOption {
  id: number
  slug: string
  name: string
}

export interface NoteTagOptionCreatePayload {
  name: string
  slug?: string
}

export interface NoteListItem {
  id: number
  slug: string
  title: string
  lang: 'zh' | 'en'
  status: 'draft' | 'published'
  summary: string
  reading_time: number
  tags: NoteTagOption[]
  published_at: string
  created_at: string
  updated_at: string
}

export interface NoteListParams {
  page: number
  page_size: number
  search: string
  ordering: string
  lang: '' | 'zh' | 'en'
  status: '' | 'draft' | 'published'
}

export interface NoteDetail extends Omit<NoteListItem, 'tags'> {
  tag_ids: number[]
  tags: NoteTagOption[]
  content_md: string
  content_html: string
  toc_json: string | Record<string, unknown> | unknown[] | null
}

export interface NoteMutationPayload extends Omit<NoteFormValues, 'published_at'> {
  published_at: string | null
}

export type NoteMutationResult = NoteDetail
