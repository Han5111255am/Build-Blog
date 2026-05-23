import type { TagFormValues } from '@/features/tags/schema/tag-form-schema'
import type { TagDetail } from '@/features/tags/types/tag'

export function mapTagDetailToFormValues(detail: TagDetail): TagFormValues {
  return {
    name: detail.name,
    slug: detail.slug,
    color: detail.color,
    description: detail.description,
  }
}

