import type { ProjectFormValues } from '@/features/projects/schema/project-form-schema'
import type { ProjectDetail } from '@/features/projects/types/project'

export function mapProjectDetailToFormValues(detail: ProjectDetail): ProjectFormValues {
  return {
    title: detail.title,
    slug: detail.slug,
    lang: detail.lang,
    status: detail.status,
    summary: detail.summary,
    site_url: detail.site_url,
    repo_url: detail.repo_url,
    icon: detail.icon,
    cover_image: detail.cover_image,
    display_order: detail.display_order,
    content_md: detail.content_md,
  }
}

