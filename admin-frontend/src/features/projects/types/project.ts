import type { ProjectFormValues } from '@/features/projects/schema/project-form-schema'

export interface ProjectListItem {
  id: number
  slug: string
  title: string
  lang: 'zh' | 'en'
  status: 'draft' | 'published'
  summary: string
  site_url: string
  repo_url: string
  icon: string
  cover_image: string
  display_order: number
  published_at: string
  created_at: string
  updated_at: string
}

export interface ProjectListParams {
  page: number
  page_size: number
  search: string
  ordering: string
  lang: '' | 'zh' | 'en'
  status: '' | 'draft' | 'published'
}

export interface ProjectDetail extends ProjectListItem {
  content_md: string
  content_html: string
}

export type ProjectMutationPayload = ProjectFormValues

export interface ProjectMutationResult {
  id?: number
}
